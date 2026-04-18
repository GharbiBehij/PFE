// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'esims_provider.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$EsimsState {





@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is EsimsState);
}


@override
int get hashCode => runtimeType.hashCode;

@override
String toString() {
  return 'EsimsState()';
}


}

/// @nodoc
class $EsimsStateCopyWith<$Res>  {
$EsimsStateCopyWith(EsimsState _, $Res Function(EsimsState) __);
}


/// Adds pattern-matching-related methods to [EsimsState].
extension EsimsStatePatterns on EsimsState {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>({TResult Function( _Initial value)?  initial,TResult Function( _Loading value)?  loading,TResult Function( _Loaded value)?  loaded,TResult Function( _Error value)?  error,required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Initial() when initial != null:
return initial(_that);case _Loading() when loading != null:
return loading(_that);case _Loaded() when loaded != null:
return loaded(_that);case _Error() when error != null:
return error(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>({required TResult Function( _Initial value)  initial,required TResult Function( _Loading value)  loading,required TResult Function( _Loaded value)  loaded,required TResult Function( _Error value)  error,}){
final _that = this;
switch (_that) {
case _Initial():
return initial(_that);case _Loading():
return loading(_that);case _Loaded():
return loaded(_that);case _Error():
return error(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>({TResult? Function( _Initial value)?  initial,TResult? Function( _Loading value)?  loading,TResult? Function( _Loaded value)?  loaded,TResult? Function( _Error value)?  error,}){
final _that = this;
switch (_that) {
case _Initial() when initial != null:
return initial(_that);case _Loading() when loading != null:
return loading(_that);case _Loaded() when loaded != null:
return loaded(_that);case _Error() when error != null:
return error(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>({TResult Function()?  initial,TResult Function()?  loading,TResult Function( List<EsimModel> esims)?  loaded,TResult Function( String message)?  error,required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Initial() when initial != null:
return initial();case _Loading() when loading != null:
return loading();case _Loaded() when loaded != null:
return loaded(_that.esims);case _Error() when error != null:
return error(_that.message);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>({required TResult Function()  initial,required TResult Function()  loading,required TResult Function( List<EsimModel> esims)  loaded,required TResult Function( String message)  error,}) {final _that = this;
switch (_that) {
case _Initial():
return initial();case _Loading():
return loading();case _Loaded():
return loaded(_that.esims);case _Error():
return error(_that.message);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>({TResult? Function()?  initial,TResult? Function()?  loading,TResult? Function( List<EsimModel> esims)?  loaded,TResult? Function( String message)?  error,}) {final _that = this;
switch (_that) {
case _Initial() when initial != null:
return initial();case _Loading() when loading != null:
return loading();case _Loaded() when loaded != null:
return loaded(_that.esims);case _Error() when error != null:
return error(_that.message);case _:
  return null;

}
}

}

/// @nodoc


class _Initial implements EsimsState {
  const _Initial();
  






@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Initial);
}


@override
int get hashCode => runtimeType.hashCode;

@override
String toString() {
  return 'EsimsState.initial()';
}


}




/// @nodoc


class _Loading implements EsimsState {
  const _Loading();
  






@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Loading);
}


@override
int get hashCode => runtimeType.hashCode;

@override
String toString() {
  return 'EsimsState.loading()';
}


}




/// @nodoc


class _Loaded implements EsimsState {
  const _Loaded(final  List<EsimModel> esims): _esims = esims;
  

 final  List<EsimModel> _esims;
 List<EsimModel> get esims {
  if (_esims is EqualUnmodifiableListView) return _esims;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_esims);
}


/// Create a copy of EsimsState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$LoadedCopyWith<_Loaded> get copyWith => __$LoadedCopyWithImpl<_Loaded>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Loaded&&const DeepCollectionEquality().equals(other._esims, _esims));
}


@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_esims));

@override
String toString() {
  return 'EsimsState.loaded(esims: $esims)';
}


}

/// @nodoc
abstract mixin class _$LoadedCopyWith<$Res> implements $EsimsStateCopyWith<$Res> {
  factory _$LoadedCopyWith(_Loaded value, $Res Function(_Loaded) _then) = __$LoadedCopyWithImpl;
@useResult
$Res call({
 List<EsimModel> esims
});




}
/// @nodoc
class __$LoadedCopyWithImpl<$Res>
    implements _$LoadedCopyWith<$Res> {
  __$LoadedCopyWithImpl(this._self, this._then);

  final _Loaded _self;
  final $Res Function(_Loaded) _then;

/// Create a copy of EsimsState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') $Res call({Object? esims = null,}) {
  return _then(_Loaded(
null == esims ? _self._esims : esims // ignore: cast_nullable_to_non_nullable
as List<EsimModel>,
  ));
}


}

/// @nodoc


class _Error implements EsimsState {
  const _Error(this.message);
  

 final  String message;

/// Create a copy of EsimsState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ErrorCopyWith<_Error> get copyWith => __$ErrorCopyWithImpl<_Error>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Error&&(identical(other.message, message) || other.message == message));
}


@override
int get hashCode => Object.hash(runtimeType,message);

@override
String toString() {
  return 'EsimsState.error(message: $message)';
}


}

/// @nodoc
abstract mixin class _$ErrorCopyWith<$Res> implements $EsimsStateCopyWith<$Res> {
  factory _$ErrorCopyWith(_Error value, $Res Function(_Error) _then) = __$ErrorCopyWithImpl;
@useResult
$Res call({
 String message
});




}
/// @nodoc
class __$ErrorCopyWithImpl<$Res>
    implements _$ErrorCopyWith<$Res> {
  __$ErrorCopyWithImpl(this._self, this._then);

  final _Error _self;
  final $Res Function(_Error) _then;

/// Create a copy of EsimsState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') $Res call({Object? message = null,}) {
  return _then(_Error(
null == message ? _self.message : message // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

/// @nodoc
mixin _$EsimDetailState {





@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is EsimDetailState);
}


@override
int get hashCode => runtimeType.hashCode;

@override
String toString() {
  return 'EsimDetailState()';
}


}

/// @nodoc
class $EsimDetailStateCopyWith<$Res>  {
$EsimDetailStateCopyWith(EsimDetailState _, $Res Function(EsimDetailState) __);
}


/// Adds pattern-matching-related methods to [EsimDetailState].
extension EsimDetailStatePatterns on EsimDetailState {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>({TResult Function( _DetailInitial value)?  initial,TResult Function( _DetailLoading value)?  loading,TResult Function( _DetailLoaded value)?  loaded,TResult Function( _Syncing value)?  syncing,TResult Function( _DetailError value)?  error,required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DetailInitial() when initial != null:
return initial(_that);case _DetailLoading() when loading != null:
return loading(_that);case _DetailLoaded() when loaded != null:
return loaded(_that);case _Syncing() when syncing != null:
return syncing(_that);case _DetailError() when error != null:
return error(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>({required TResult Function( _DetailInitial value)  initial,required TResult Function( _DetailLoading value)  loading,required TResult Function( _DetailLoaded value)  loaded,required TResult Function( _Syncing value)  syncing,required TResult Function( _DetailError value)  error,}){
final _that = this;
switch (_that) {
case _DetailInitial():
return initial(_that);case _DetailLoading():
return loading(_that);case _DetailLoaded():
return loaded(_that);case _Syncing():
return syncing(_that);case _DetailError():
return error(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>({TResult? Function( _DetailInitial value)?  initial,TResult? Function( _DetailLoading value)?  loading,TResult? Function( _DetailLoaded value)?  loaded,TResult? Function( _Syncing value)?  syncing,TResult? Function( _DetailError value)?  error,}){
final _that = this;
switch (_that) {
case _DetailInitial() when initial != null:
return initial(_that);case _DetailLoading() when loading != null:
return loading(_that);case _DetailLoaded() when loaded != null:
return loaded(_that);case _Syncing() when syncing != null:
return syncing(_that);case _DetailError() when error != null:
return error(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>({TResult Function()?  initial,TResult Function()?  loading,TResult Function( EsimModel esim)?  loaded,TResult Function( EsimModel esim)?  syncing,TResult Function( String message)?  error,required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DetailInitial() when initial != null:
return initial();case _DetailLoading() when loading != null:
return loading();case _DetailLoaded() when loaded != null:
return loaded(_that.esim);case _Syncing() when syncing != null:
return syncing(_that.esim);case _DetailError() when error != null:
return error(_that.message);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>({required TResult Function()  initial,required TResult Function()  loading,required TResult Function( EsimModel esim)  loaded,required TResult Function( EsimModel esim)  syncing,required TResult Function( String message)  error,}) {final _that = this;
switch (_that) {
case _DetailInitial():
return initial();case _DetailLoading():
return loading();case _DetailLoaded():
return loaded(_that.esim);case _Syncing():
return syncing(_that.esim);case _DetailError():
return error(_that.message);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>({TResult? Function()?  initial,TResult? Function()?  loading,TResult? Function( EsimModel esim)?  loaded,TResult? Function( EsimModel esim)?  syncing,TResult? Function( String message)?  error,}) {final _that = this;
switch (_that) {
case _DetailInitial() when initial != null:
return initial();case _DetailLoading() when loading != null:
return loading();case _DetailLoaded() when loaded != null:
return loaded(_that.esim);case _Syncing() when syncing != null:
return syncing(_that.esim);case _DetailError() when error != null:
return error(_that.message);case _:
  return null;

}
}

}

/// @nodoc


class _DetailInitial implements EsimDetailState {
  const _DetailInitial();
  






@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _DetailInitial);
}


@override
int get hashCode => runtimeType.hashCode;

@override
String toString() {
  return 'EsimDetailState.initial()';
}


}




/// @nodoc


class _DetailLoading implements EsimDetailState {
  const _DetailLoading();
  






@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _DetailLoading);
}


@override
int get hashCode => runtimeType.hashCode;

@override
String toString() {
  return 'EsimDetailState.loading()';
}


}




/// @nodoc


class _DetailLoaded implements EsimDetailState {
  const _DetailLoaded(this.esim);
  

 final  EsimModel esim;

/// Create a copy of EsimDetailState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DetailLoadedCopyWith<_DetailLoaded> get copyWith => __$DetailLoadedCopyWithImpl<_DetailLoaded>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _DetailLoaded&&(identical(other.esim, esim) || other.esim == esim));
}


@override
int get hashCode => Object.hash(runtimeType,esim);

@override
String toString() {
  return 'EsimDetailState.loaded(esim: $esim)';
}


}

/// @nodoc
abstract mixin class _$DetailLoadedCopyWith<$Res> implements $EsimDetailStateCopyWith<$Res> {
  factory _$DetailLoadedCopyWith(_DetailLoaded value, $Res Function(_DetailLoaded) _then) = __$DetailLoadedCopyWithImpl;
@useResult
$Res call({
 EsimModel esim
});




}
/// @nodoc
class __$DetailLoadedCopyWithImpl<$Res>
    implements _$DetailLoadedCopyWith<$Res> {
  __$DetailLoadedCopyWithImpl(this._self, this._then);

  final _DetailLoaded _self;
  final $Res Function(_DetailLoaded) _then;

/// Create a copy of EsimDetailState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') $Res call({Object? esim = null,}) {
  return _then(_DetailLoaded(
null == esim ? _self.esim : esim // ignore: cast_nullable_to_non_nullable
as EsimModel,
  ));
}


}

/// @nodoc


class _Syncing implements EsimDetailState {
  const _Syncing(this.esim);
  

 final  EsimModel esim;

/// Create a copy of EsimDetailState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SyncingCopyWith<_Syncing> get copyWith => __$SyncingCopyWithImpl<_Syncing>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Syncing&&(identical(other.esim, esim) || other.esim == esim));
}


@override
int get hashCode => Object.hash(runtimeType,esim);

@override
String toString() {
  return 'EsimDetailState.syncing(esim: $esim)';
}


}

/// @nodoc
abstract mixin class _$SyncingCopyWith<$Res> implements $EsimDetailStateCopyWith<$Res> {
  factory _$SyncingCopyWith(_Syncing value, $Res Function(_Syncing) _then) = __$SyncingCopyWithImpl;
@useResult
$Res call({
 EsimModel esim
});




}
/// @nodoc
class __$SyncingCopyWithImpl<$Res>
    implements _$SyncingCopyWith<$Res> {
  __$SyncingCopyWithImpl(this._self, this._then);

  final _Syncing _self;
  final $Res Function(_Syncing) _then;

/// Create a copy of EsimDetailState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') $Res call({Object? esim = null,}) {
  return _then(_Syncing(
null == esim ? _self.esim : esim // ignore: cast_nullable_to_non_nullable
as EsimModel,
  ));
}


}

/// @nodoc


class _DetailError implements EsimDetailState {
  const _DetailError(this.message);
  

 final  String message;

/// Create a copy of EsimDetailState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DetailErrorCopyWith<_DetailError> get copyWith => __$DetailErrorCopyWithImpl<_DetailError>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _DetailError&&(identical(other.message, message) || other.message == message));
}


@override
int get hashCode => Object.hash(runtimeType,message);

@override
String toString() {
  return 'EsimDetailState.error(message: $message)';
}


}

/// @nodoc
abstract mixin class _$DetailErrorCopyWith<$Res> implements $EsimDetailStateCopyWith<$Res> {
  factory _$DetailErrorCopyWith(_DetailError value, $Res Function(_DetailError) _then) = __$DetailErrorCopyWithImpl;
@useResult
$Res call({
 String message
});




}
/// @nodoc
class __$DetailErrorCopyWithImpl<$Res>
    implements _$DetailErrorCopyWith<$Res> {
  __$DetailErrorCopyWithImpl(this._self, this._then);

  final _DetailError _self;
  final $Res Function(_DetailError) _then;

/// Create a copy of EsimDetailState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') $Res call({Object? message = null,}) {
  return _then(_DetailError(
null == message ? _self.message : message // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
