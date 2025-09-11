import mongoose from 'mongoose';

const MovieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  theater: {
    name: { type: String, required: true },
    location: { type: String, required: true },
    type: { type: String, enum: ['multiplex', 'arthouse'], required: true }
  },
  showtime: { type: Date, required: true },
  isArtHouse: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

MovieSchema.index({ showtime: 1 });

export const Movie = mongoose.models.Movie || mongoose.model('Movie', MovieSchema);
