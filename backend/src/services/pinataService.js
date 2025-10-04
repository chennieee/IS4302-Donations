const axios = require('axios');
const FormData = require('form-data');
const config = require('../../config');

class PinataService {
  constructor() {
    this.baseURL = 'https://api.pinata.cloud';
    this.headers = {
      'pinata_api_key': config.pinata.apiKey,
      'pinata_secret_api_key': config.pinata.secretApiKey,
    };
  }

  async pinJSONToIPFS(jsonData) {
    try {
      const data = {
        pinataContent: jsonData,
        pinataOptions: {
          cidVersion: 1
        }
      };

      const response = await axios.post(
        `${this.baseURL}/pinning/pinJSONToIPFS`,
        data,
        { headers: this.headers }
      );

      return {
        success: true,
        cid: response.data.IpfsHash,
        size: response.data.PinSize
      };
    } catch (error) {
      console.error('Pinata JSON pin error:', error.response?.data || error.message);
      throw new Error(`Failed to pin JSON to IPFS: ${error.response?.data?.error || error.message}`);
    }
  }

  async pinFileToIPFS(fileBuffer, fileName) {
    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, fileName);

      const response = await axios.post(
        `${this.baseURL}/pinning/pinFileToIPFS`,
        formData,
        {
          headers: {
            ...this.headers,
            ...formData.getHeaders()
          }
        }
      );

      return {
        success: true,
        cid: response.data.IpfsHash,
        size: response.data.PinSize
      };
    } catch (error) {
      console.error('Pinata file pin error:', error.response?.data || error.message);
      throw new Error(`Failed to pin file to IPFS: ${error.response?.data?.error || error.message}`);
    }
  }
}

module.exports = PinataService;