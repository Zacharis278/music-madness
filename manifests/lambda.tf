
# Base App Lambda
resource "aws_lambda_function" "app" {
  s3_bucket = "${aws_s3_bucket_object.app.bucket}"
  s3_key = "${aws_s3_bucket_object.app.key}"
  s3_object_version = "${aws_s3_bucket_object.app.version_id}"

  function_name = "${var.resource_prefix}-app"
  handler = "functions/message.handler"
  runtime = "nodejs6.10"
  role = "${aws_iam_role.lambda_execution.arn}"

  timeout = 60

  environment = {
    variables = {
      SPOTIFY_CLIENT_ID = "${var.spotify_clientid}"
      SPOTIFY_SECRET = "${var.spotify_secret}"
    }
  }
}

resource "aws_lambda_permission" "allow_api_gateway-thing1" {
  function_name = "${aws_lambda_function.app.arn}"
  statement_id = "AllowExecutionFromApiGateway"
  action = "lambda:InvokeFunction"
  principal = "apigateway.amazonaws.com"
  source_arn = "arn:aws:execute-api:${var.aws_region}:${data.aws_caller_identity.current.account_id}:${aws_api_gateway_rest_api.api.id}/*/${aws_api_gateway_method.post_message.http_method}${aws_api_gateway_resource.message.path}"
}