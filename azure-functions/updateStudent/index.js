const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE || 'TeachingTrackerDb';
const containerId = process.env.COSMOS_CONTAINER || 'students';

async function updateStudentInCosmos(studentId, updates) {
  if (!endpoint || !key) {
    return updates;
  }

  const client = new CosmosClient({ endpoint, key });
  const database = client.database(databaseId);
  const container = database.container(containerId);
  const { resource } = await container.item(studentId, studentId).replace(updates);
  return resource;
}

app.http('updateStudent', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'students/{studentId}',
  handler: async (request, context) => {
    try {
      const studentId = request.params.studentId;
      const updates = await request.json();
      const updated = await updateStudentInCosmos(studentId, { id: studentId, ...updates });
      return {
        status: 200,
        jsonBody: updated,
      };
    } catch (error) {
      context.error(error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to update student' },
      };
    }
  },
});
