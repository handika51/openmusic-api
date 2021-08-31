const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsService {
  constructor(collaborationService) {
    this.pool = new Pool();
    this.collaborationService = collaborationService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this.pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }
    return result.rows[0].id;
  }

  async addSongToPlaylist(playlistId, songId) {
    const id = `playlist-song-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlistsongs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Lagu gagal ditambahkan ke playlist');
    }
  }

  async getPlaylists(owner) {
    const query = {
      text: 'SELECT playlists.*, users.username FROM playlists INNER JOIN users ON users.id = playlists.owner LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id WHERE playlists.owner = $1 OR collaborations.user_id = $1',
      values: [owner],
    };
    const result = await this.pool.query(query);
    if (!result.rowCount) {
      const playlists = [];
      return playlists;
    }
    const { id, name, username } = result.rows[0];
    const playlists = [{ id, name, username }];

    return playlists;
  }

  async getPlaylistSongs(playlistId) {
    const query = {
      text: 'SELECT songs.id, songs.title, songs.performer FROM playlists INNER JOIN playlistsongs ON playlistsongs.playlist_id = playlists.id INNER JOIN songs ON playlistsongs.song_id = songs.id WHERE playlists.id = $1',
      values: [playlistId],
    };

    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Gagal menampilkan lagu dalam playlist');
    }
    const { id, title, performer } = result.rows[0];
    const playlistsongs = [{ id, title, performer }];
    return playlistsongs;
  }

  async deletePlaylist(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Playlist gagal dihapus');
    }
  }

  async deletePlaylistSong(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlistsongs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this.pool.query(query);
    if (!result.rowCount) {
      throw new InvariantError('Lagu gagal dihapus dari playlist');
    }
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT owner FROM playlists WHERE id = $1',
      values: [id],
    };

    const result = await this.pool.query(query);

    const playlist = result.rows[0];

    if (playlist.owner !== owner || owner === undefined) {
      throw new AuthorizationError('Anda tidak berhak mengakses data ini');
    }
  }

  async verifySong(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };
    const result = await this.pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    const query = {
      text: 'SELECT playlists.id FROM playlists INNER JOIN users ON users.id = playlists.owner LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id WHERE (playlists.owner = $1 OR collaborations.user_id = $1) AND playlists.id = $2',
      values: [userId, playlistId],
    };
    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new AuthorizationError('Anda tidak berhak mengakses data ini');
    }
  }
}

module.exports = PlaylistsService;
