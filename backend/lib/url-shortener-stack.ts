import * as cdk from "@aws-cdk/core"
import * as ApiGateway from "@aws-cdk/aws-apigatewayv2"
import * as lambda from "@aws-cdk/aws-lambda"
import * as dynamo from "@aws-cdk/aws-dynamodb"

export class UrlShortenerStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const urlShortenerTable = new dynamo.Table(this, "urlShortenerTable", {
      partitionKey: { name: "shortUrl", type: dynamo.AttributeType.STRING }
    })

    urlShortenerTable.addGlobalSecondaryIndex({
      indexName: "longUrlIndex",
      partitionKey: { name: "longUrl", type: dynamo.AttributeType.STRING }
    })

    const createLambda = new lambda.Function(this, "createLambda", {
      code: lambda.Code.fromAsset("lambda"),
      handler: "create.handler",
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 320,
      environment: {
        TABLE_NAME: urlShortenerTable.tableName
      }
    })

    const redirectLambda = new lambda.Function(this, "redirectLambda", {
      code: lambda.Code.fromAsset("lambda"),
      handler: "redirect.handler",
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 320,
      environment: {
        TABLE_NAME: urlShortenerTable.tableName
      }
    })

    urlShortenerTable.grant(createLambda, "dynamodb:Query", "dynamodb:PutItem")
    urlShortenerTable.grant(redirectLambda, "dynamodb:GetItem")

    const httpApi = new ApiGateway.HttpApi(this, "urlShortenerApi")

    httpApi.addRoutes({
      path: "/create",
      methods: [ApiGateway.HttpMethod.POST],
      integration: new ApiGateway.LambdaProxyIntegration({
        handler: createLambda
      })
    })

    httpApi.addRoutes({
      path: "/{shortUrl}",
      methods: [ApiGateway.HttpMethod.GET],
      integration: new ApiGateway.LambdaProxyIntegration({
        handler: redirectLambda
      })
    })
  }
}
