window.copyPhone = function (phone) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(phone).then(() => {
      const toast = document.createElement('div');
      toast.className = 'copy-toast';
      toast.textContent = '✅ تم نسخ الرقم: ' + phone;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2200);
    });
  } else {
    const input = document.createElement('input');
    input.value = phone;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    input.remove();
  }
};
