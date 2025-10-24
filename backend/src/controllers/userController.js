const Database = require('../models/database')

// Helper: Normalize wallet
function normalizeWallet(addr) {
  if (!addr || typeof addr !== 'string') return ''
  return addr.toLowerCase()
}

class UserController {
  constructor() {
    this.db = new Database()
    this.getUser = this.getUser.bind(this)
    this.updateUser = this.updateUser.bind(this)
  }

  async initialize() {
    await this.db.initialize()
    await this.db.createTables()
  }

  // GET  /api/users/:address
  async getUser(req, res) {
    try {
      const walletAddr = normalizeWallet(req.params.address)

      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddr)) {
        return res.status(400).json({ error: 'Invalid wallet address' })
      }

      const user = await this.db.get(
        `SELECT wallet_addr, username, avatar_url, created_at, updated_at
        FROM users
        WHERE wallet_addr = ?`,
        [walletAddr]
      )

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      return res.status(200).json(user)

    } catch (e) {
      console.error('getUser threw:', e)
      return res.status(500).json({ error: 'Server error' })
    }
  }

  // PUT  /api/users/:address
  async updateUser(req, res) {
    try {
      const walletAddr = normalizeWallet(req.params.address)

      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddr)) {
        return res.status(400).json({ error: 'Invalid wallet address' })
      }

      const { username, avatar_url } = req.body || {}

      const safeUsername =
        typeof username === 'string' ? username.trim() : ''
      const safeAvatar =
        typeof avatar_url === 'string' && avatar_url.length > 0
          ? avatar_url
          : null

      await this.db.run(
        `INSERT INTO users (wallet_addr, username, avatar_url, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(wallet_addr)
        DO UPDATE SET
          username = excluded.username,
          avatar_url = excluded.avatar_url,
          updated_at = CURRENT_TIMESTAMP`,
        [walletAddr, safeUsername, safeAvatar]
      )

      // fetch updated row
      const savedUser = this.db.get(
            `SELECT wallet_addr, username, avatar_url, created_at, updated_at
            FROM users
            WHERE wallet_addr = ?`,
            [walletAddr]
      )
      return res.status(200).json(savedUser)
    } catch (e) {
      console.error('updateUser threw:', e)
      return res.status(500).json({ error: 'Server error' })
    }
  }
}

module.exports = UserController