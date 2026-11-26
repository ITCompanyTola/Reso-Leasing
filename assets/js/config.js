/* Настройки формы регистрации.
   endpoint — адрес обработчика заявок (POST, JSON: fullName, department, createdAt). Пока он пуст,
   форма честно сообщает, что регистрация недоступна, и не показывает ложный успех. */
window.RESO_CONFIG = {
  endpoint: '',
  timeoutMs: 15000
};
