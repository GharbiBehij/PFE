import 'package:dio/dio.dart';

import 'package:esim_frontend/core/errors/app_exception.dart';
import 'package:esim_frontend/core/errors/error_handler.dart';

class OfferDatasource {
  const OfferDatasource(this._dio);

  final Dio _dio;

  Future<List<Map<String, dynamic>>> getPopularOffers() async {
    try {
      final res = await _dio.get<List<dynamic>>('/offers/popular');
      return (res.data as List).cast<Map<String, dynamic>>();
    } on DioException catch (e) {
      throw ErrorHandler.handle(e);
    } on AppException {
      rethrow;
    }
  }

  Future<List<Map<String, dynamic>>> getOffersByCountry(String country) async {
    try {
      final res = await _dio.get<List<dynamic>>(
        '/offers',
        queryParameters: {'country': country},
      );
      return (res.data as List).cast<Map<String, dynamic>>();
    } on DioException catch (e) {
      throw ErrorHandler.handle(e);
    } on AppException {
      rethrow;
    }
  }

  Future<List<Map<String, dynamic>>> searchOffers(String query) async {
    try {
      final res = await _dio.get<List<dynamic>>(
        '/offers/search',
        queryParameters: {'q': query},
      );
      return (res.data as List).cast<Map<String, dynamic>>();
    } on DioException catch (e) {
      throw ErrorHandler.handle(e);
    } on AppException {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> getOfferById(int id) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>('/offers/$id');
      return res.data!;
    } on DioException catch (e) {
      throw ErrorHandler.handle(e);
    } on AppException {
      rethrow;
    }
  }

  Future<List<Map<String, dynamic>>> getDestinations() async {
    try {
      final res = await _dio.get<List<dynamic>>('/offers/destinations');
      return (res.data as List).cast<Map<String, dynamic>>();
    } on DioException catch (e) {
      throw ErrorHandler.handle(e);
    } on AppException {
      rethrow;
    }
  }
}
