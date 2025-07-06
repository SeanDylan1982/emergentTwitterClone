const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'video', 'gif'],
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true,
    unique: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true,
    min: 0,
    max: 50 * 1024 * 1024 // 50MB max
  },
  dimensions: {
    width: {
      type: Number,
      min: 1
    },
    height: {
      type: Number,
      min: 1
    }
  },
  duration: {
    type: Number, // for videos, in seconds
    min: 0
  },
  urls: {
    original: {
      type: String,
      required: true
    },
    thumbnail: String,
    small: String,
    medium: String,
    large: String
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processingError: String,
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  alt: {
    type: String,
    maxlength: 200
  },
  caption: {
    type: String,
    maxlength: 500
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  isSensitive: {
    type: Boolean,
    default: false
  },
  // Metadata for images
  exif: {
    camera: String,
    lens: String,
    iso: Number,
    aperture: String,
    shutterSpeed: String,
    focalLength: String,
    flash: Boolean,
    location: {
      latitude: Number,
      longitude: Number
    }
  },
  // CDN and storage info
  cloudinaryId: String,
  s3Key: String,
  cdnUrl: String
}, {
  timestamps: true
});

// Indexes
mediaSchema.index({ userId: 1, createdAt: -1 });
mediaSchema.index({ type: 1, createdAt: -1 });
mediaSchema.index({ processingStatus: 1 });
mediaSchema.index({ filename: 1 }, { unique: true });
mediaSchema.index({ usageCount: -1 });

// TTL index to automatically delete unused media after 30 days
mediaSchema.index({ 
  createdAt: 1 
}, { 
  expireAfterSeconds: 30 * 24 * 60 * 60,
  partialFilterExpression: { usageCount: 0 }
});

// Virtual for main URL (returns best available quality)
mediaSchema.virtual('url').get(function() {
  return this.urls.large || this.urls.medium || this.urls.small || this.urls.original;
});

// Method to increment usage count
mediaSchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  return this.save();
};

// Method to decrement usage count
mediaSchema.methods.decrementUsage = async function() {
  if (this.usageCount > 0) {
    this.usageCount -= 1;
    return this.save();
  }
  return this;
};

// Static method to create media with variants
mediaSchema.statics.createWithVariants = async function(mediaData, variants = {}) {
  const media = new this({
    ...mediaData,
    urls: {
      original: mediaData.originalUrl,
      ...variants
    }
  });
  
  return media.save();
};

// Static method to get user media
mediaSchema.statics.getUserMedia = async function(userId, type = null, limit = 20, skip = 0) {
  const filter = { 
    userId,
    processingStatus: 'completed',
    isApproved: true
  };
  
  if (type) {
    filter.type = type;
  }
  
  return this.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .select('-exif -cloudinaryId -s3Key') // Exclude sensitive data
    .lean();
};

// Static method to get media by filename
mediaSchema.statics.getByFilename = async function(filename) {
  return this.findOne({ filename });
};

// Static method to update processing status
mediaSchema.statics.updateProcessingStatus = async function(mediaId, status, error = null) {
  const update = { processingStatus: status };
  if (error) {
    update.processingError = error;
  }
  
  return this.findByIdAndUpdate(mediaId, update, { new: true });
};

// Pre-remove middleware to clean up files
mediaSchema.pre('remove', async function(next) {
  // Here you would implement file cleanup from storage (S3, Cloudinary, etc.)
  // This is a placeholder for the actual implementation
  console.log(`Cleaning up media files for ${this.filename}`);
  next();
});

// Method to generate responsive variants
mediaSchema.methods.generateVariants = async function() {
  // This would integrate with image processing service
  // Placeholder for actual implementation
  const variants = {};
  
  if (this.type === 'image') {
    // Generate different sizes
    variants.thumbnail = `${this.urls.original}?w=150&h=150&c=fill`;
    variants.small = `${this.urls.original}?w=400&h=400&c=fit`;
    variants.medium = `${this.urls.original}?w=800&h=800&c=fit`;
    variants.large = `${this.urls.original}?w=1200&h=1200&c=fit`;
  }
  
  this.urls = { ...this.urls, ...variants };
  this.processingStatus = 'completed';
  
  return this.save();
};

module.exports = mongoose.model('Media', mediaSchema);