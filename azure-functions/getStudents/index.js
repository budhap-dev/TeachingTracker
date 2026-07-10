const { app } = require('@azure/functions')
const { CosmosClient } = require('@azure/cosmos')

const endpoint = process.env.COSMOS_ENDPOINT
const key = process.env.COSMOS_KEY
const databaseId = process.env.COSMOS_DATABASE || 'TeachingTrackerDb'
const containerId = process.env.COSMOS_CONTAINER || 'students'

async function getStudentsFromCosmos() {
    if (!endpoint || !key) {
        return []
    }

    const client = new CosmosClient({ endpoint, key })
    const database = client.database(databaseId)
    const container = database.container(containerId)
    const { resources } = await container.items.readAll().fetchAll()
    return resources
}

app.http('getStudents', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'students',
    handler: async (request, context) => {
        try {
            const students = await getStudentsFromCosmos()
            return {
                status: 200,
                jsonBody: students,
            }
        } catch (error) {
            context.error(error)
            return {
                status: 500,
                jsonBody: { error: 'Failed to fetch students' },
            }
        }
    },
})
