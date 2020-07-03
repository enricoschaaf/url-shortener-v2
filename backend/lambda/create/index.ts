import DynamoDB = require("aws-sdk/clients/dynamodb")
import { APIGatewayProxyHandlerV2 } from "aws-lambda"
import { nanoid } from "nanoid"

const tableName = process.env.TABLE_NAME
const dynamo = new DynamoDB.DocumentClient()

async function create({ shortUrl, longUrl }: { shortUrl: string; longUrl: string }) {
  if (!longUrl || shortUrl === "create") throw Error
  const { Items } = await dynamo
    .query({
      TableName: tableName,
      IndexName: "longUrlIndex",
      ExpressionAttributeValues: { ":longUrl": longUrl },
      KeyConditionExpression: "longUrl = :longUrl",
      ProjectionExpression: "shortUrl"
    })
    .promise()
  if (Items && Items.length > 0) return Items[0].shortUrl
  if (shortUrl) {
    await dynamo
      .put({
        TableName: tableName,
        Item: { shortUrl, longUrl },
        ConditionExpression: "  attribute_not_exists(shortUrl)"
      })
      .promise()
    return shortUrl
  }
  while (!shortUrl) {
    try {
      const id = nanoid(6)
      await dynamo
        .put({
          TableName: tableName,
          Item: { shortUrl: id, longUrl },
          ConditionExpression: "attribute_not_exists(shortUrl)"
        })
        .promise()
      shortUrl = id
    } catch (err) {
      console.error(err)
    }
  }
  return shortUrl
}

const createHandler: APIGatewayProxyHandlerV2 = async ({ body }) => {
  try {
    if (!body) throw Error
    const data = JSON.parse(body)
    const shortUrl = await create(data)
    return { data: { shortUrl } }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 400
    }
  }
}

exports.handler = createHandler
