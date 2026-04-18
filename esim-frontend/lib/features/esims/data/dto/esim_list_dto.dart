import 'package:esim_frontend/features/esims/data/dto/esim_dto.dart';
import 'package:esim_frontend/features/esims/models/esim_list.dart';

class EsimListDto {
  const EsimListDto({required this.active, required this.expired});

  final List<EsimDto> active;
  final List<EsimDto> expired;

  factory EsimListDto.fromJson(Map<String, dynamic> json) => EsimListDto(
        active: (json['active'] as List<dynamic>)
            .cast<Map<String, dynamic>>()
            .map(EsimDto.fromJson)
            .toList(),
        expired: (json['expired'] as List<dynamic>)
            .cast<Map<String, dynamic>>()
            .map(EsimDto.fromJson)
            .toList(),
      );

  EsimList toDomain() => EsimList(
        active: active.map((e) => e.toDomain()).toList(),
        expired: expired.map((e) => e.toDomain()).toList(),
      );
}
