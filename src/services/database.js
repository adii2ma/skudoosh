import SQLite from 'react-native-sqlite-storage';

class DatabaseService {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.db = await SQLite.openDatabase({
        name: 'VoiceAppDB.db',
        location: 'default'
      });

      await this.createTables();
      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  async createTables() {
    const createConversationsTable = `
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createKeywordsTable = `
      CREATE TABLE IF NOT EXISTS keywords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER,
        word TEXT NOT NULL,
        score REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      )
    `;

    try {
      await this.db.executeSql(createConversationsTable);
      await this.db.executeSql(createKeywordsTable);
      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  async storeConversation(text, keywords) {
    if (!this.initialized) await this.initialize();

    try {
      // Start transaction
      await this.db.transaction(async (tx) => {
        // Insert conversation
        const [result] = await tx.executeSql(
          'INSERT INTO conversations (text) VALUES (?)',
          [text]
        );
        const conversationId = result.insertId;

        // Insert keywords
        for (const keyword of keywords) {
          await tx.executeSql(
            'INSERT INTO keywords (conversation_id, word, score) VALUES (?, ?, ?)',
            [conversationId, keyword.word, keyword.score]
          );
        }

        return conversationId;
      });
    } catch (error) {
      console.error('Error storing conversation:', error);
      throw error;
    }
  }

  async getKeywords() {
    if (!this.initialized) await this.initialize();

    try {
      const [result] = await this.db.executeSql(
        'SELECT DISTINCT word FROM keywords ORDER BY word'
      );
      return result.rows.raw().map(row => row.word);
    } catch (error) {
      console.error('Error fetching keywords:', error);
      throw error;
    }
  }

  async searchConversations(keyword) {
    if (!this.initialized) await this.initialize();

    try {
      const [result] = await this.db.executeSql(
        `SELECT c.*, k.word, k.score 
         FROM conversations c 
         JOIN keywords k ON c.id = k.conversation_id 
         WHERE k.word LIKE ? 
         ORDER BY c.timestamp DESC`,
        [`%${keyword}%`]
      );
      return result.rows.raw();
    } catch (error) {
      console.error('Error searching conversations:', error);
      throw error;
    }
  }

  async getFilteredLogs(startDate, endDate, keyword) {
    if (!this.initialized) await this.initialize();

    try {
      let query = `
        SELECT c.*, k.word, k.score 
        FROM conversations c 
        JOIN keywords k ON c.id = k.conversation_id 
        WHERE 1=1
      `;
      const params = [];

      if (startDate) {
        query += ' AND c.timestamp >= ?';
        params.push(startDate);
      }
      if (endDate) {
        query += ' AND c.timestamp <= ?';
        params.push(endDate);
      }
      if (keyword) {
        query += ' AND k.word LIKE ?';
        params.push(`%${keyword}%`);
      }

      query += ' ORDER BY c.timestamp DESC';

      const [result] = await this.db.executeSql(query, params);
      return result.rows.raw();
    } catch (error) {
      console.error('Error fetching filtered logs:', error);
      throw error;
    }
  }
}

export default new DatabaseService(); 