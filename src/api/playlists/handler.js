class PlaylistsHandler {
  constructor(service, validator) {
    this.service = service;
    this.validator = validator;

    this.postPlaylistHandler = this.postPlaylistHandler.bind(this);
    this.postPlaylistSongHandler = this.postPlaylistSongHandler.bind(this);
    this.getPlaylistsHandler = this.getPlaylistsHandler.bind(this);
    this.getPlaylistSongsHandler = this.getPlaylistSongsHandler.bind(this);
    this.deletePlaylistHandler = this.deletePlaylistHandler.bind(this);
    this.deletePlaylistSongHandler = this.deletePlaylistSongHandler.bind(this);
  }

  async postPlaylistHandler(request, h) {
    this.validator.validatePlaylistPayload(request.payload);

    const { name } = request.payload;
    const { id: owner } = request.auth.credentials;

    const playlistId = await this.service.addPlaylist({ name, owner });

    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil ditambahkan',
      data: {
        playlistId,
      },
    });
    response.code(201);
    return response;
  }

  async postPlaylistSongHandler(request, h) {
    this.validator.validatePlaylistSongPayload(request.payload);

    const { songId } = request.payload;
    const { playlistId } = request.params;
    const { id: owner } = request.auth.credentials;

    await this.service.verifySong(songId);

    await this.service.verifyPlaylistAccess(playlistId, owner);

    await this.service.addSongToPlaylist(playlistId, songId);

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan ke playlist',
    });
    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request) {
    const { id: owner } = request.auth.credentials;
    const playlists = await this.service.getPlaylists(owner);
    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async getPlaylistSongsHandler(request) {
    const { id: owner } = request.auth.credentials;
    const { playlistId } = request.params;
    await this.service.verifyPlaylistAccess(playlistId, owner);
    const playlistsongs = await this.service.getPlaylistSongs(playlistId);
    return {
      status: 'success',
      data: {
        songs: playlistsongs,
      },
    };
  }

  async deletePlaylistHandler(request) {
    const { playlistId } = request.params;
    const { id: owner } = request.auth.credentials;

    await this.service.verifyPlaylistOwner(playlistId, owner);
    await this.service.deletePlaylist(playlistId);
    return {
      status: 'success',
      message: 'Playlist berhasil dihapus',
    };
  }

  async deletePlaylistSongHandler(request) {
    this.validator.validatePlaylistSongPayload(request.payload);
    const { songId } = request.payload;
    const { playlistId } = request.params;
    const { id: owner } = request.auth.credentials;

    await this.service.verifyPlaylistAccess(playlistId, owner);
    await this.service.deletePlaylistSong(playlistId, songId);
    return {
      status: 'success',
      message: 'Lagu berhasil dihapus dari playlist',
    };
  }
}

module.exports = PlaylistsHandler;
