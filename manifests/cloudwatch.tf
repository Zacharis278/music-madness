# Create a Scheduled Event.
#resource "aws_cloudwatch_event_rule" "trigger" {
#  name = "${var.resource_prefix}-trigger"
#  description = "does stuff"
#  schedule_expression = "cron(0/15 13-21 ? * MON-FRI *)"
#}

# Target the API lambda
#resource "aws_cloudwatch_event_target" "trigger" {
#  rule = "${aws_cloudwatch_event_rule.trigger.name}"
#  arn = "${aws_lambda_function.trigger.arn}"
#  input = "{}"
#}