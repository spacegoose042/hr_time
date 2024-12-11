import AppDataSource from './connection';

export const setupDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection initialized');

    // Log the entities that are registered
    const entities = AppDataSource.entityMetadatas;
    console.log('Registered entities:', entities.map(e => e.name));

    // Test the connection
    await AppDataSource.query('SELECT NOW()');
    console.log('Database connection test successful');
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
};

// Execute if run directly
if (require.main === module) {
  setupDatabase()
    .then(() => console.log('Database initialization complete'))
    .catch(error => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
} 