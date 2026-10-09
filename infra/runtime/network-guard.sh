#!/bin/bash
# Host-only: block new container connections to host metadata, private
# networks and other tenants. Existing connections and same-bridge traffic
# (the tunnel reaching the BOT API) remain permitted. IPv6 is not enabled
# on this Compose network. Domain allowlisting requires the release proxy.
set -euo pipefail
iptables -w -N AGB-EGRESS 2>/dev/null || true
iptables -w -C DOCKER-USER -i agb-runtime ! -o agb-runtime -j AGB-EGRESS 2>/dev/null || \
  iptables -w -I DOCKER-USER 1 -i agb-runtime ! -o agb-runtime -j AGB-EGRESS
iptables -w -C AGB-EGRESS -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN 2>/dev/null || \
  iptables -w -A AGB-EGRESS -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
for destination in 0.0.0.0/8 10.0.0.0/8 100.64.0.0/10 127.0.0.0/8 169.254.0.0/16 172.16.0.0/12 192.168.0.0/16 224.0.0.0/4; do
  iptables -w -C AGB-EGRESS -d "$destination" -j REJECT 2>/dev/null || \
    iptables -w -A AGB-EGRESS -d "$destination" -j REJECT
done
# Traffic to the host itself traverses INPUT, not DOCKER-USER.
iptables -w -C INPUT -i agb-runtime -j DROP 2>/dev/null || iptables -w -I INPUT 1 -i agb-runtime -j DROP
