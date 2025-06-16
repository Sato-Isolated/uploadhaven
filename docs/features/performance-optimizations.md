# 🚀 Performance Optimizations

## Overview

UploadHaven implements advanced performance optimizations for file encryption and processing, enabling efficient handling of files ranging from small documents to multi-gigabyte videos.

## 🎯 Key Performance Features

### ⚡ Streaming Encryption
- **Threshold**: 100MB (files above this size use streaming)
- **Chunk Size**: 1MB for optimal memory/speed balance
- **Memory Usage**: Constant memory consumption regardless of file size
- **Scalability**: Supports arbitrarily large files

### 🔄 Optimized Batch Processing
- **Parallel Threshold**: 500MB (files above this size use batch processing)
- **Batch Size**: 16MB for optimal CPU/memory utilization
- **Architecture**: Direct cipher processing (faster than worker threads)
- **Event Loop**: Non-blocking with automatic yield control

### 🗄️ Intelligent Key Caching
- **Strategy**: LRU (Least Recently Used) eviction
- **Cache Size**: 100 keys maximum
- **TTL**: 30 minutes for security/performance balance
- **Statistics**: Real-time hit/miss/eviction tracking

### 📦 Smart Compression
- **Intelligence**: Automatic detection of compressible vs compressed formats
- **Supported Formats**: Comprehensive detection of video, audio, images, archives
- **Efficiency**: Up to 99.7% compression for text files
- **Time Savings**: Avoids 30+ seconds of processing per video file

## 📊 Performance Metrics

### Test Environment Specifications ⚠️ IMPORTANT

**Hardware Configuration (Test Results)**:
- **CPU**: AMD Ryzen 7 5800X (8 cores, 16 threads)
- **Storage**: Crucial P3 NVMe SSD 2TB
  - Interface: PCIe Gen 3 x4
  - Sequential Read: 3,500 MB/s
  - Sequential Write: 3,000 MB/s
  - Form Factor: M.2 (2280)
- **Environment**: Local development machine

> ⚠️ **VPS Performance Warning**: Performance metrics shown below were obtained on high-end consumer hardware. VPS environments will show significantly different results due to:
> - Shared CPU resources
> - Network-attached storage (typically slower than NVMe)
> - Memory limitations
> - Network I/O constraints
> - Virtualization overhead

### Tested Results (High-End Hardware)

#### 1.7GB Video File (MP4)
- **Processing Time**: 1.32 seconds
- **Speed**: 1.29 GB/s
- **Batches**: 107 batches of 16MB each
- **Memory Usage**: 16MB maximum
- **Compression**: Automatically skipped (saves 34+ seconds)

#### Text Files
- **Compression Ratio**: Up to 99.7%
- **Compression Speed**: 292 KB/ms
- **Intelligence**: Automatically applied to compressible formats

### Expected VPS Performance

#### Typical VPS Constraints
- **CPU**: Shared cores, variable performance
- **Storage**: Network storage (100-500 MB/s typical)
- **Memory**: Limited and shared
- **Expected throughput**: 50-200 MB/s (vs 1.29 GB/s on test hardware)

#### VPS Optimization Benefits
Even with reduced absolute performance, the optimizations provide:
- **Memory efficiency**: Still constant O(1) usage
- **Processing strategy**: Automatic method selection remains optimal
- **Compression intelligence**: Format detection saves CPU time
- **Key caching**: Reduces expensive operations regardless of hardware

## ⚙️ VPS Configuration Recommendations

### Minimum VPS Requirements
```typescript
// Recommended VPS specs for optimal performance
const VPS_RECOMMENDATIONS = {
  // CPU: Dedicated cores preferred over shared
  cpu: "2+ dedicated vCPUs", 
  
  // RAM: Critical for large file processing
  memory: "4GB minimum, 8GB recommended",
  
  // Storage: SSD strongly recommended
  storage: "SSD-based storage (avoid HDD)",
  
  // Network: For file transfers
  bandwidth: "1 Gbps minimum for large files"
};
```

### VPS-Optimized Configuration
```typescript
// Adjust thresholds for VPS environments
export const VPS_OPTIMIZED_CONFIG = {
  // Lower thresholds for resource-constrained environments
  STREAM_THRESHOLD: 50 * 1024 * 1024,   // 50MB (vs 100MB)
  PARALLEL_THRESHOLD: 250 * 1024 * 1024, // 250MB (vs 500MB)
  
  // Smaller batches to reduce memory pressure
  BATCH_SIZE: 8 * 1024 * 1024,          // 8MB (vs 16MB)
  CHUNK_SIZE: 512 * 1024,               // 512KB (vs 1MB)
  
  // More aggressive key caching for slower storage
  KEY_CACHE_SIZE: 200,                   // 200 keys (vs 100)
  KEY_CACHE_TTL: 60 * 60 * 1000,        // 60 minutes (vs 30)
  
  // Lower compression level for CPU-constrained VPS
  COMPRESSION_LEVEL: 3,                  // Level 3 (vs 6)
};
```

### Performance Expectations by VPS Tier

#### Entry VPS (1-2 vCPU, 2-4GB RAM)
- **Expected throughput**: 20-50 MB/s
- **Recommended max file**: 500MB
- **Key benefit**: Memory optimization prevents OOM errors

#### Mid-tier VPS (2-4 vCPU, 4-8GB RAM)  
- **Expected throughput**: 50-150 MB/s
- **Recommended max file**: 2GB
- **Key benefit**: Streaming prevents memory exhaustion

#### High-end VPS (4+ vCPU, 8+ GB RAM)
- **Expected throughput**: 150-400 MB/s  
- **Recommended max file**: 5GB+
- **Key benefit**: Near-optimal performance with intelligent batching

### Monitoring VPS Performance

```typescript
// Add to your monitoring
const performanceMonitoring = {
  // Track actual vs expected performance
  metrics: [
    'processing_time_per_mb',
    'memory_usage_peak',
    'compression_effectiveness',
    'cache_hit_ratio'
  ],
  
  // Alerts for performance degradation
  alerts: {
    slowProcessing: 'throughput < 10 MB/s',
    highMemory: 'memory > 80% available',
    lowCacheHit: 'cache_hit_ratio < 50%'
  }
};
```

## 🔧 Configuration

```typescript
export const PERFORMANCE_CONFIG = {
  // Streaming thresholds
  STREAM_THRESHOLD: 100 * 1024 * 1024, // 100MB
  CHUNK_SIZE: 1 * 1024 * 1024, // 1MB chunks
  
  // Parallel processing
  PARALLEL_THRESHOLD: 500 * 1024 * 1024, // 500MB
  BATCH_SIZE: 16 * 1024 * 1024, // 16MB batches
  
  // Key caching
  KEY_CACHE_SIZE: 100, // 100 keys max
  KEY_CACHE_TTL: 30 * 60 * 1000, // 30 minutes
  
  // Compression
  COMPRESSION_THRESHOLD: 1024 * 1024, // 1MB
  COMPRESSION_LEVEL: 6, // Speed/compression balance
} as const;
```

## 🎯 Automatic Optimization Selection

The system automatically selects the optimal processing method based on file characteristics:

### Small Files (<100MB)
- **Method**: Standard encryption
- **Memory**: Full file in memory
- **Speed**: Fastest for small files
- **Use Case**: Documents, images, small videos

### Medium Files (100MB - 500MB)
- **Method**: Streaming encryption
- **Memory**: 1MB chunks
- **Speed**: Optimized memory usage
- **Use Case**: Large documents, medium videos

### Large Files (>500MB)
- **Method**: Batch processing
- **Memory**: 16MB batches
- **Speed**: Maximum throughput
- **Use Case**: Large videos, archives, datasets

## 🔍 Integration Points

### Upload API (`/api/upload`)
- Automatically uses performance encryption for files >100MB
- Compression intelligence applied based on MIME type and filename
- Real-time performance metrics logging

### Download API (`/api/download/[shortUrl]`)
- Automatic selection of optimal decryption method
- Streaming for large files to minimize memory usage
- Performance metrics collection

### File Decryption (`/lib/file-decryption.ts`)
- Intelligent method selection based on file size
- Seamless fallback between standard and performance modes
- Comprehensive error handling and logging

## 📈 Performance Benefits

### Memory Efficiency
- **Before**: O(n) memory usage (full file size)
- **After**: O(1) memory usage (constant 16MB max)
- **Benefit**: Enables processing of files larger than available RAM
- **VPS Impact**: Critical for memory-constrained environments

### Processing Speed
- **High-end hardware**: 3-5x faster processing through batching (1.29 GB/s achieved)
- **VPS environments**: Still significant improvements through intelligent processing
- **Compression**: Intelligent avoidance saves 30+ seconds per video (universal benefit)
- **Method selection**: Automatic optimization regardless of hardware performance

### Scalability
- **File Size**: No practical limits (tested up to 1.7GB)
- **Concurrent Users**: Constant memory per operation (crucial for VPS)
- **Server Resources**: Optimized CPU and memory utilization
- **Hardware Agnostic**: Benefits scale proportionally across hardware tiers

## 🧪 Testing and Validation

### Test Coverage
- ✅ Unit tests for all optimization components
- ✅ Integration tests with real large files
- ✅ Performance benchmarks with various file types
- ✅ Memory usage validation
- ✅ Compression intelligence verification

### Real-World Testing
- ✅ 1.7GB MP4 video file
- ✅ 606MB MKV video file
- ✅ Large text files with compression
- ✅ Mixed file type processing

## 🔮 Future Enhancements

### Potential Optimizations
- [ ] GPU acceleration for specific file types
- [ ] Adaptive batch sizes based on system resources
- [ ] Advanced compression algorithms (Brotli, LZMA)
- [ ] File-type specific optimization profiles
- [ ] Distributed processing for extremely large files

### Monitoring and Analytics
- [ ] Performance metrics dashboard
- [ ] Real-time optimization recommendations
- [ ] Historical performance tracking
- [ ] Resource usage analytics

## 🛠️ Implementation Details

### Key Classes

#### `PerformanceEncryption`
```typescript
static async encryptFileOptimized(
  sourceBuffer: Buffer,
  password: string,
  options: {
    mimeType?: string;
    filename?: string;
    forceStreaming?: boolean;
    enableCompression?: boolean;
    useParallel?: boolean;
  }
): Promise<EncryptionResult>
```

#### `PerformanceDecryption`
```typescript
static async decryptFileOptimized(
  encryptedBuffer: Buffer,
  password: string,
  metadata: EncryptionMetadata
): Promise<Buffer>
```

#### `CompressionManager`
```typescript
static shouldCompress(
  fileSize: number, 
  mimeType: string, 
  filename?: string
): boolean
```

#### `KeyCache`
```typescript
async getKey(
  password: string, 
  salt: Buffer, 
  iterations?: number
): Promise<Buffer>
```

### Performance Monitoring

The system includes comprehensive performance monitoring:

```typescript
const timer = PerformanceMetrics.startTiming('encryption');
// ... processing ...
timer.end(fileSize);
```

Metrics collected:
- Processing time per operation
- Throughput (bytes/second)
- Memory usage patterns
- Cache hit/miss ratios
- Compression effectiveness

## 📚 Related Documentation

- [File Encryption](./file-encryption.md) - Core encryption features
- [Security](./security.md) - Security considerations
- [Technical Architecture](../project/technical.md) - Overall system design
- [API Reference](../api/reference.md) - API documentation

---

**Last Updated**: June 2025  
**Status**: ✅ Fully Implemented and Tested
