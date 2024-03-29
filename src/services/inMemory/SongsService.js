const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class SongsService {
  constructor() {
    this.songs = [];
  }

  addSong({
    title, year, performer, genre, duration,
  }) {
    const id = nanoid(16);
    const insertedAt = new Date().toISOString();
    const updatedAt = insertedAt;

    const newSong = {
      title,
      year: +year,
      performer,
      genre,
      duration: +duration,
      id,
      insertedAt,
      updatedAt,
    };

    this.songs.push(newSong);

    const isSuccess = this.songs.filter((song) => song.id === id).length > 0;

    if (!isSuccess) {
      throw new InvariantError('Lagu gagal ditambahkan');
    }

    return id;
  }

  getSongs() {
    const { id, title, performer } = this.songs[0];
    const songs = [{ id, title, performer }];
    return songs;
  }

  getSongById(id) {
    const song = this.songs.filter((n) => n.id === id)[0];
    if (!song) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }
    return song;
  }

  editSongById(id, {
    title, year, performer, genre, duration,
  }) {
    const index = this.songs.findIndex((song) => song.id === id);

    if (index === -1) {
      throw new NotFoundError('Gagal memperbarui lagu. Id tidak ditemukan');
    }

    const updatedAt = new Date().toISOString();

    this.songs[index] = {
      ...this.songs[index],
      title,
      year: +year,
      performer,
      genre,
      duration: +duration,
      updatedAt,
    };
  }

  deleteSongById(id) {
    const index = this.songs.findIndex((song) => song.id === id);

    if (index === -1) {
      throw new NotFoundError('Lagu gagal dihapus. Id tidak ditemukan');
    }

    this.songs.splice(index, 1);
  }
}

module.exports = SongsService;
