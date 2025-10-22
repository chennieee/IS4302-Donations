const Database = require('../models/database');
const Joi = require('joi');

class UserController {
    constructor() {
        this.db = new Database();
        this.getUser = this.getUser.bind(this);
        this.updateUser = this.updateUser.bind(this);
    }

    async initialize() {
        await this.db.initialize();
        await this.db.createTables();
    }

    // Validators
    validateAddress(address) {
        const schema = Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required();
        return schema.validate(address);
    }

    validateUpdate(body) {
        const schema = Joi.object({
            username: Joi.string().trim().min(1).max(64).allow(null, ''),
            avatar_url: Joi.string().url().allow(null, ''),
        }).unknown(false);
        return schema.validate(body || {});
    }

    // GET  /users/:address
    async getUser(req, res) {
        try {
            const wallet_addr = String(req.params.address || '').toLowerCase();
            const { error } = this.validateAddress(wallet_addr);
            if (error) return res.status(400).json({ error: 'Invalid wallet address' });

            const selectSql = `
                SELECT wallet_addr, username, avatar_url, created_at, updated_at
                FROM users
                WHERE wallet_addr = ?
            `;
            const user = await this.db.get(selectSql, [wallet_addr]);
            return res.json(user || { wallet_addr, username: null, avatar_url: null });
        
        } catch (e) {
            console.error('getUser error:', e);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // PUT  /users/:address
    async updateUser(req, res) {
        try {
            const wallet_addr = String(req.params.address || '').toLowerCase();
            const { error } = this.validateAddress(wallet_addr);
            if (error) return res.status(400).json({ error: 'Invalid wallet address' });

            const { error: bodyErr, value } = this.validateUpdate(req.body);
            if (bodyErr) return res.status(400).json({ error: bodyErr.details[0].message });

            const upsertSql = `
                INSERT INTO users (wallet_addr, username, avatar_url, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(wallet_addr) DO UPDATE SET
                    username = excluded.username
                    avatar_url = excluded.avatar_url,
                    updated_at = CURRENT_TIMESTAMP
            `;

            await this.db.run(upsertSql, [
                wallet_addr,
                value.username ?? null,
                value.avatar_url ?? null,
            ]);

            const selectSql = `
                SELECT wallet_addr, username, avatar_url, created_at, updated_at
                FROM users
                WHERE wallet_addr = ?
            `;
            const saved = await this.db.get(selectSql, [wallet_addr]);
            return res.json(saved)
            
        } catch (e) {
            console.error('updateUser error:', e);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = UserController;