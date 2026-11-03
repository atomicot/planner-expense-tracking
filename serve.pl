#!/usr/bin/perl
# Minimal static file server (no install needed on macOS): perl serve.pl [dir] [port]
use strict; use warnings; use IO::Socket::INET;
my ($root, $port) = @ARGV; $root ||= "."; $port ||= 5173;
my %types = (html=>'text/html; charset=utf-8', css=>'text/css', js=>'application/javascript', json=>'application/json',
             svg=>'image/svg+xml', png=>'image/png', md=>'text/plain; charset=utf-8', rules=>'text/plain');
my $srv = IO::Socket::INET->new(LocalAddr=>'127.0.0.1', LocalPort=>$port, Listen=>20, ReuseAddr=>1) or die "listen: $!";
print "serving $root on http://localhost:$port\n";
$| = 1;
while (my $c = $srv->accept) {
  my $req = <$c>; next unless $req;
  while (my $l = <$c>) { last if $l =~ /^\r?\n$/; }
  my ($path) = $req =~ m{^GET\s+(\S+)}; $path //= '/';
  $path =~ s/\?.*//; $path =~ s/%([0-9A-Fa-f]{2})/chr(hex $1)/ge;
  $path = '/index.html' if $path eq '/';
  if ($path =~ /\.\./) { print $c "HTTP/1.0 403 Forbidden\r\n\r\n"; close $c; next; }
  my $f = "$root$path";
  if (-f $f && open(my $fh, '<:raw', $f)) {
    local $/; my $body = <$fh>; close $fh;
    my ($ext) = $f =~ /\.(\w+)$/; my $ct = $types{lc($ext // '')} // 'application/octet-stream';
    print $c "HTTP/1.0 200 OK\r\nContent-Type: $ct\r\nContent-Length: ".length($body)."\r\nCache-Control: no-store\r\n\r\n$body";
  } else { print $c "HTTP/1.0 404 Not Found\r\nContent-Length: 9\r\n\r\nnot found"; }
  close $c;
}
