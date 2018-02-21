resource "aws_api_gateway_rest_api" "api" {
  name = "${var.rest_api_title}"
  description = ""
  lifecycle {
    ignore_changes = ["description", "name"]
  }
}

######################
# Main Endpoint      #
######################
resource "aws_api_gateway_resource" "message" {
  rest_api_id = "${aws_api_gateway_rest_api.api.id}"
  parent_id = "${aws_api_gateway_rest_api.api.root_resource_id}"
  path_part = "message"
}

resource "aws_api_gateway_method" "post_message" {
  rest_api_id = "${aws_api_gateway_rest_api.api.id}"
  resource_id = "${aws_api_gateway_resource.message.id}"
  http_method = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "post_message" {
  rest_api_id = "${aws_api_gateway_rest_api.api.id}"
  resource_id = "${aws_api_gateway_resource.message.id}"
  http_method = "${aws_api_gateway_method.post_message.http_method}"
  type = "AWS_PROXY"
  uri = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.aws_region}:${data.aws_caller_identity.current.account_id}:function:${aws_lambda_function.app.function_name}/invocations"
  integration_http_method = "POST"
}


resource "aws_api_gateway_deployment" "v1" {
  depends_on = [
    "aws_api_gateway_method.post_message",
    "aws_api_gateway_integration.post_message"
  ]
  rest_api_id = "${aws_api_gateway_rest_api.api.id}"
  stage_name = "v1"
}