import 'package:esim_frontend/features/esims/models/esim.dart';

class EsimList {
  const EsimList({required this.active, required this.expired});

  final List<Esim> active;
  final List<Esim> expired;

}
