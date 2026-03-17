package com.bcb.backend.mysql.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Service
public class TokenBlacklistService {

    private static final Logger logger = LoggerFactory.getLogger(TokenBlacklistService.class);

    private StringRedisTemplate redisTemplate;

    public TokenBlacklistService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void blacklistToken(String token, Date expiration) {
        long ttlMillis = expiration.getTime() - System.currentTimeMillis();

        if (ttlMillis <= 0) {
            return;
        }

        try {
            redisTemplate.opsForValue().set(token, "blacklisted", ttlMillis, TimeUnit.MILLISECONDS);
        } catch (DataAccessException e) {
            logger.warn("Redis unavailable while blacklisting token. Logout will continue without blacklist.", e);
        }
    }

    public boolean isTokenBlacklisted(String token) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(token));
        } catch (DataAccessException e) {
            logger.warn("Redis unavailable while checking token blacklist. Continuing without blacklist check.", e);
            return false;
        }
    }

    public Map<String, Long> getAllBlacklistedTokens() {
        Map<String, Long> tokenWithTTL = new HashMap<>();
        Set<String> tokens;

        try {
            tokens = redisTemplate.keys("*");
        } catch (DataAccessException e) {
            logger.warn("Redis unavailable while fetching blacklisted tokens.", e);
            return tokenWithTTL;
        }

        if (tokens != null) {
            for (String token : tokens) {
                Long ttl;
                try {
                    ttl = redisTemplate.getExpire(token, TimeUnit.MILLISECONDS);
                } catch (DataAccessException e) {
                    logger.warn("Redis unavailable while reading TTL for token blacklist entry.", e);
                    ttl = -1L;
                }
                tokenWithTTL.put(token, ttl != null ? ttl : -1); // -1 nếu không có TTL
            }
        }

        return tokenWithTTL;
    }
}
