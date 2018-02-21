
# Base App Lambda
resource "aws_lambda_function" "app" {
  s3_bucket = "${aws_s3_bucket_object.app.bucket}"
  s3_key = "${aws_s3_bucket_object.app.key}"
  s3_object_version = "${aws_s3_bucket_object.app.version_id}"

  function_name = "${var.resource_prefix}-app"
  handler = "functions/handler.handler"
  runtime = "nodejs6.10"
  role = "${aws_iam_role.lambda_execution.arn}"

  timeout = 60

  environment = {
    variables = "${var.lambda_env_config}"
  }
}