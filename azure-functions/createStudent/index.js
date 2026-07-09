const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE || 'TeachingTrackerDb';
const containerId = process.env.COSMOS_CONTAINER || 'students';

async function createStudentInCosmos(student) {
  if (!endpoint || !key) {
    return student;
  }

  const client = new CosmosClient({ endpoint, key });
  const database = client.database(databaseId);
  const container = database.container(containerId);
  const { resource } = await container.items.create(student);
  return resource;
}

app.http('createStudent', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'students',
  handler: async (request, context) => {
    try {
      const student = await request.json();
      const studentWithId = {
        id: student.id || `${Date.now()}`,
        ...student,
      };
      const created = await createStudentInCosmos(studentWithId);
      return {
        status: 201,
        jsonBody: created,
      };
    } catch (error) {
      context.error(error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to create student' },
      };
    }
  },
});
