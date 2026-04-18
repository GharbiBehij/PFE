class UpdateProfileRequest {
  const UpdateProfileRequest({
    this.firstname,
    this.lastname,
    this.email,
    this.phone,
  });

  final String? firstname;
  final String? lastname;
  final String? email;
  final String? phone;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (firstname != null) map['firstname'] = firstname;
    if (lastname != null) map['lastname'] = lastname;
    if (email != null) map['email'] = email;
    if (phone != null) map['phone'] = phone;
    return map;
  }
}
