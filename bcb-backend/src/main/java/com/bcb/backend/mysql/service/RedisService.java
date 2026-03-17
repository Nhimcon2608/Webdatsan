package com.bcb.backend.mysql.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.data.redis.core.ValueOperations;

@Service
public class RedisService {

    private static final Logger logger = LoggerFactory.getLogger(RedisService.class);

    @Autowired
    private ValueOperations<String, String> valueOperations;

    private static final String EMAIL_PREFIX = "email:";
    private static final String PHONE_PREFIX = "phone:";

    public boolean existsPhoneInCache(String phone) {
        try {
            return valueOperations.get(PHONE_PREFIX + phone) != null;
        } catch (DataAccessException e) {
            logger.warn("Redis unavailable while checking phone cache.", e);
            return false;
        }
    }

    public boolean existsEmailInCache(String email) {
        try {
            return valueOperations.get(EMAIL_PREFIX + email) != null;
        } catch (DataAccessException e) {
            logger.warn("Redis unavailable while checking email cache.", e);
            return false;
        }
    } 
    
    public void addPhoneToCache(String phone) {
        try {
            valueOperations.set(PHONE_PREFIX + phone, "exists");
        } catch (DataAccessException e) {
            logger.warn("Redis unavailable while caching phone.", e);
        }
    }

    public void addEmailToCache(String email) {
        try {
            valueOperations.set(EMAIL_PREFIX + email, "exists");
        } catch (DataAccessException e) {
            logger.warn("Redis unavailable while caching email.", e);
        }
    }

}
