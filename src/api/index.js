/**
 * API Layer - Re-export all API modules
 * 
 * ARCHITECTURAL NOTE:
 * This is the single entry point for all API access.
 * Components should import from here, not directly from individual API files.
 * This makes it easy to add authentication, logging, or swap implementations.
 */

export * from './landApi.js';
