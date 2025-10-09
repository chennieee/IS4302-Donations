const PinataService = require('../services/pinataService');
const multer = require('multer');

class IPFSController {
  constructor() {
    this.pinataService = new PinataService();

    // Configure multer for file uploads (simple validation: file size < 10MB)
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 10
      }
    });
  }

  // POST /pin
  async pinContent(req, res) {
    try {
      // Handle both JSON and file uploads
      if (req.is('application/json')) {
        await this.pinJSON(req, res);
      } else {
        await this.pinFiles(req, res);
      }
    } catch (error) {
      console.error('Pin content error:', error);
      res.status(500).json({ error: 'Failed to pin content to IPFS' });
    }
  }

  async pinJSON(req, res) {
    try {
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'No content provided' });
      }

      const result = await this.pinataService.pinJSONToIPFS(content);

      res.json({
        success: true,
        cid: result.cid,
        size: result.size,
        type: 'json'
      });
    } catch (error) {
      console.error('JSON pin error:', error);
      res.status(500).json({ error: 'Failed to pin JSON to IPFS' });
    }
  }

  async pinFiles(req, res) {
    // Use multer middleware
    this.upload.array('files')(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ error: `Upload error: ${err.message}` });
        }
        return res.status(400).json({ error: err.message });
      }

      try {
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ error: 'No files provided' });
        }

        const results = [];

        for (const file of req.files) {
          const result = await this.pinataService.pinFileToIPFS(
            file.buffer,
            file.originalname
          );

          results.push({
            filename: file.originalname,
            cid: result.cid,
            size: result.size,
            mimetype: file.mimetype
          });
        }

        res.json({
          success: true,
          files: results,
          type: 'files'
        });
      } catch (error) {
        console.error('File pin error:', error);
        res.status(500).json({ error: 'Failed to pin files to IPFS' });
      }
    });
  }
}

module.exports = IPFSController;