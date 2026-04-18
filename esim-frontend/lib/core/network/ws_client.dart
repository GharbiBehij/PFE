// TODO: integrate with eSIM activation status updates — call connect() after
// login and disconnect() on logout once real-time events are needed.
import 'package:esim_frontend/core/constants/api_constants.dart';
import 'package:esim_frontend/core/storage/token_storage.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

/// Singleton Socket.IO client.
/// Call [connect] once after login; [disconnect] on logout.
class WsClient {
  WsClient(this._storage);

  final TokenStorage _storage;
  io.Socket? _socket;

  io.Socket get socket {
    assert(_socket != null, 'WsClient: call connect() first');
    return _socket!;
  }

  io.Socket? get socketOrNull => _socket;

  Future<void> connect() async {
    final token = await _storage.getAccessToken();
    _socket = io.io(
      ApiConstants.wsUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .enableAutoConnect()
          .build(),
    );
    _socket!.connect();
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }
}
