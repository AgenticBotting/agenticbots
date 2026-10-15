# One VPC for all client runtimes. Runtime instances always have zero inbound
# security-group rules and are administered through Systems Manager. Egress is
# deliberately environment-specific:
#
# - `direct` is the low-cost staging path. A runtime receives a public IPv4
#   address solely so it can initiate outbound connections through the internet
#   gateway. No inbound port is opened.
# - `nat` is the production path. Runtimes have no public IP and initiate
#   outbound connections through a managed NAT gateway.

variable "name" { type = string }
variable "cidr" {
  type    = string
  default = "10.42.0.0/16"
}
variable "egress_mode" {
  description = "direct for low-cost staging or nat for private production egress."
  type        = string
  default     = "nat"
  validation {
    condition     = contains(["direct", "nat"], var.egress_mode)
    error_message = "egress_mode must be direct or nat."
  }
}
variable "tags" {
  type    = map(string)
  default = {}
}

data "aws_availability_zones" "available" { state = "available" }

resource "aws_vpc" "this" {
  cidr_block           = var.cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = merge(var.tags, { Name = var.name })
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id
  tags   = merge(var.tags, { Name = var.name })
}

# NAT mode needs a dedicated public subnet. Direct mode does not create it.
resource "aws_subnet" "egress" {
  count                   = var.egress_mode == "nat" ? 1 : 0
  vpc_id                  = aws_vpc.this.id
  cidr_block              = cidrsubnet(var.cidr, 8, 0)
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = false
  tags                    = merge(var.tags, { Name = "${var.name}-egress" })
}

resource "aws_subnet" "runtime" {
  count                   = 2
  vpc_id                  = aws_vpc.this.id
  cidr_block              = cidrsubnet(var.cidr, 8, count.index + 16)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false
  tags                    = merge(var.tags, { Name = "${var.name}-runtime-${count.index}" })
}

resource "aws_eip" "nat" {
  count  = var.egress_mode == "nat" ? 1 : 0
  domain = "vpc"
  tags   = merge(var.tags, { Name = "${var.name}-nat" })
}

resource "aws_nat_gateway" "this" {
  count         = var.egress_mode == "nat" ? 1 : 0
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.egress[0].id
  tags          = merge(var.tags, { Name = "${var.name}-nat" })

  depends_on = [aws_internet_gateway.this]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }
  tags = merge(var.tags, { Name = "${var.name}-public" })
}

resource "aws_route_table_association" "egress" {
  count          = var.egress_mode == "nat" ? 1 : 0
  subnet_id      = aws_subnet.egress[0].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "runtime" {
  vpc_id = aws_vpc.this.id
  route {
    cidr_block     = "0.0.0.0/0"
    gateway_id     = var.egress_mode == "direct" ? aws_internet_gateway.this.id : null
    nat_gateway_id = var.egress_mode == "nat" ? aws_nat_gateway.this[0].id : null
  }
  tags = merge(var.tags, {
    Name = "${var.name}-runtime-${var.egress_mode == "nat" ? "private" : "direct-egress"}"
  })
}

resource "aws_route_table_association" "runtime" {
  count          = length(aws_subnet.runtime)
  subnet_id      = aws_subnet.runtime[count.index].id
  route_table_id = aws_route_table.runtime.id
}

# Lock down the default security group so nothing accidentally uses it.
resource "aws_default_security_group" "default" {
  vpc_id = aws_vpc.this.id
  tags   = merge(var.tags, { Name = "${var.name}-default-locked" })
}

output "vpc_id" { value = aws_vpc.this.id }
output "subnet_ids" { value = aws_subnet.runtime[*].id }
output "associate_public_ip_address" {
  description = "Whether runtime instances need a public IPv4 address for outbound-only direct egress."
  value       = var.egress_mode == "direct"
}
