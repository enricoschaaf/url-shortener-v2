import { APIGatewayProxyHandlerV2 } from "aws-lambda"
import DynamoDB = require("aws-sdk/clients/dynamodb")

const tableName = process.env.TABLE_NAME
const dynamo = new DynamoDB.DocumentClient()

const redirect = async (shortUrl: string) => {
  if (shortUrl) {
    return await dynamo
      .get({
        TableName: tableName,
        Key: { shortUrl },
        ProjectionExpression: "longUrl"
      })
      .promise()
  }
  throw Error
}

const redirectHandler: APIGatewayProxyHandlerV2 = async ({ rawPath }) => {
  try {
    const { Item } = await redirect(rawPath.slice(1))
    if (Item?.longUrl) {
      return { statusCode: 301, headers: { Location: Item.longUrl } }
    }
    throw Error
  } catch (err) {
    console.error(err)
    return {
      statusCode: 404
    }
  }
}

exports.handler = redirectHandler
