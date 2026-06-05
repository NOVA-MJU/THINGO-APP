export const PASSWORD_REGEX =
  /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export const PASSWORD_MESSAGE = '비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다.';
