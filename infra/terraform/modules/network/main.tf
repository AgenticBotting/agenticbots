# One VPC for all client runtimes. Each runtime gets its own security group
# with NO inbound rules: administration goes through Systems Manager and the
# runtime's API is reached through an outbound-only Cloudflare Tunnel.
# (Outbound-only + no inbound rules means a public IP exposes nothing; switch
# to private subnets + NAT if your security policy requires no public IPs.)

variable "name" { type = string }
variable "cidr" {
  type    = string
  default = "10.42.0.0/16"
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

resource "aws_subnet" "runtime" {
  count                   = 2
  vpc_id                  = aws_vpc.this.id
  cidr_block              = cidrsubnet(var.cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags                    = merge(var.tags, { Name = "${var.name}-runtime-${count.index}" })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }
  tags = merge(var.tags, { Name = "${var.name}-public" })
}

resource "aws_route_table_association" "runtime" {
  count          = length(aws_subnet.runtime)
  subnet_id      = aws_subnet.runtime[count.index].id
  route_table_id = aws_route_table.public.id
}

# Lock down the default security group so nothing accidentally uses it.
resource "aws_default_security_group" "default" {
  vpc_id = aws_vpc.this.id
  tags   = merge(var.tags, { Name = "${var.name}-default-locked" })
}

output "vpc_id" { value = aws_vpc.this.id }
output "subnet_ids" { value = aws_subnet.runtime[*].id }
