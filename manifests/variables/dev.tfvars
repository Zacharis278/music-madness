# Deployment environment variables
aws_region="us-east-1"
env="dev"
rest_api_title="Music Madness Bot API - DEV"

# Lambda environment config
lambda_env_config = {
  PING_RESPONSE = "PONG",
  DYNAMO_ENDPOINT = "dynamodb.us-east-1.amazonaws.com"
}
