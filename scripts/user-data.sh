#!/bin/bash

# SprintSync EC2 Instance Setup Script
# This script runs when the instance first boots

set -e

# Update system (Amazon Linux uses yum)
yum update -y

# Install Docker
yum install -y docker

# Install docker-compose separately (not available in Amazon Linux repos)
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group (Amazon Linux uses ec2-user)
usermod -aG docker ec2-user

# Install additional tools
yum install -y curl wget git unzip

# Create deployment directory
mkdir -p /opt/sprintsync
chown ec2-user:ec2-user /opt/sprintsync

# Install AWS CLI (for future use)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
rm -rf awscliv2.zip aws

# Install CloudWatch agent
echo "📊 Installing CloudWatch agent..."
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i -E ./amazon-cloudwatch-agent.deb
rm -f ./amazon-cloudwatch-agent.deb

# Configure CloudWatch agent
echo "⚙️  Configuring CloudWatch agent..."
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'CWEOF'
{
  "agent": {
    "run_as_user": "cwagent"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/lib/docker/containers/*/*-json.log",
            "log_group_name": "/sprintsync/dev/docker",
            "log_stream_name": "{instance_id}/docker-containers",
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/syslog",
            "log_group_name": "/sprintsync/dev/system",
            "log_stream_name": "{instance_id}/syslog",
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/auth.log",
            "log_group_name": "/sprintsync/dev/system",
            "log_stream_name": "{instance_id}/auth",
            "timezone": "UTC"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "SprintSync/Dev",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
        "metrics_collection_interval": 60,
        "totalcpu": false
      },
      "disk": {
        "measurement": ["used_percent"],
        "metrics_collection_interval": 60,
        "resources": ["*"]
      },
      "diskio": {
        "measurement": ["io_time"],
        "metrics_collection_interval": 60,
        "resources": ["*"]
      },
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 60
      }
    }
  }
}
CWEOF

# Start CloudWatch agent
echo "🚀 Starting CloudWatch agent..."
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Setup log rotation for Docker
cat > /etc/logrotate.d/docker << EOF
/var/lib/docker/containers/*/*.log {
  rotate 5
  daily
  compress
  size=10M
  missingok
  delaycompress
  copytruncate
}
EOF

# Create swap file (helps with small instances)
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# Set timezone
timedatectl set-timezone UTC

# Create startup script for SprintSync
cat > /opt/sprintsync/startup.sh << 'EOF'
#!/bin/bash
cd /opt/sprintsync
if [ -f docker-compose.prod.yml ]; then
    docker-compose -f docker-compose.prod.yml up -d
fi
EOF

chmod +x /opt/sprintsync/startup.sh

# Setup systemd service for auto-start
cat > /etc/systemd/system/sprintsync.service << 'EOF'
[Unit]
Description=SprintSync Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/sprintsync
ExecStart=/opt/sprintsync/startup.sh
User=ec2-user

[Install]
WantedBy=multi-user.target
EOF

systemctl enable sprintsync.service

# Signal completion
/opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource AutoScalingGroup --region ${AWS::Region} 2>/dev/null || echo "Instance setup completed successfully!"

echo "✅ SprintSync EC2 instance setup completed!"
echo "📝 Instance ready for deployment"
