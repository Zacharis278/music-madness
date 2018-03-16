
# Slack Message Lambda
resource "aws_lambda_function" "message" {
  s3_bucket = "${aws_s3_bucket_object.app.bucket}"
  s3_key = "${aws_s3_bucket_object.app.key}"
  s3_object_version = "${aws_s3_bucket_object.app.version_id}"

  function_name = "${var.resource_prefix}-message"
  handler = "functions/message.handler"
  runtime = "nodejs6.10"
  role = "${aws_iam_role.lambda_execution.arn}"

  timeout = 60

  environment = {
    variables = {
      SPOTIFY_CLIENT_ID = "${var.spotify_clientid}"
      SPOTIFY_SECRET = "${var.spotify_secret}"
      SLACK_TOKEN = "${var.slack_token}"
      DYNAMO_ENDPOINT = "${var.lambda_env_config["DYNAMO_ENDPOINT"]}"
    }
  }
}

# Slack Action Lambda
resource "aws_lambda_function" "action" {
  s3_bucket = "${aws_s3_bucket_object.app.bucket}"
  s3_key = "${aws_s3_bucket_object.app.key}"
  s3_object_version = "${aws_s3_bucket_object.app.version_id}"

  function_name = "${var.resource_prefix}-action"
  handler = "functions/action.handler"
  runtime = "nodejs6.10"
  role = "${aws_iam_role.lambda_execution.arn}"

  timeout = 60

  environment = {
    variables = {
      SPOTIFY_CLIENT_ID = "${var.spotify_clientid}"
      SPOTIFY_SECRET = "${var.spotify_secret}"
      SLACK_TOKEN = "${var.slack_token}"
      DYNAMO_ENDPOINT = "${var.lambda_env_config["DYNAMO_ENDPOINT"]}"
    }
  }
}

# Triggered Events Lambda
resource "aws_lambda_function" "trigger" {
  s3_bucket = "${aws_s3_bucket_object.app.bucket}"
  s3_key = "${aws_s3_bucket_object.app.key}"
  s3_object_version = "${aws_s3_bucket_object.app.version_id}"

  function_name = "${var.resource_prefix}-trigger"
  handler = "functions/trigger.handler"
  runtime = "nodejs6.10"
  role = "${aws_iam_role.lambda_execution.arn}"

  timeout = 60

  environment = {
    variables = {
      SPOTIFY_CLIENT_ID = "${var.spotify_clientid}"
      SPOTIFY_SECRET = "${var.spotify_secret}"
      SLACK_TOKEN = "${var.slack_token}"
      DYNAMO_ENDPOINT = "${var.lambda_env_config["DYNAMO_ENDPOINT"]}"
    }
  }
}

resource "aws_lambda_permission" "allow_api_gateway-message" {
  function_name = "${aws_lambda_function.message.arn}"
  statement_id = "AllowExecutionFromApiGateway"
  action = "lambda:InvokeFunction"
  principal = "apigateway.amazonaws.com"
  source_arn = "arn:aws:execute-api:${var.aws_region}:${data.aws_caller_identity.current.account_id}:${aws_api_gateway_rest_api.api.id}/*/${aws_api_gateway_method.post_message.http_method}${aws_api_gateway_resource.message.path}"
}

resource "aws_lambda_permission" "allow_api_gateway-action" {
  function_name = "${aws_lambda_function.action.arn}"
  statement_id = "AllowExecutionFromApiGateway"
  action = "lambda:InvokeFunction"
  principal = "apigateway.amazonaws.com"
  source_arn = "arn:aws:execute-api:${var.aws_region}:${data.aws_caller_identity.current.account_id}:${aws_api_gateway_rest_api.api.id}/*/${aws_api_gateway_method.post_message.http_method}${aws_api_gateway_resource.action.path}"
}