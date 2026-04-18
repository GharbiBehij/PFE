import 'package:esim_frontend/features/esims/data/models/esim_model.dart';

abstract class EsimRepository {
  Future<List<EsimModel>> getMyEsims();
  Future<EsimModel> getEsimById(String id);
  Future<EsimModel> syncUsage(String id);
  Future<void> deleteEsim(String id);
}
