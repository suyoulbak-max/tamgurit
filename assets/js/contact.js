(function () {
  "use strict";

  var form = document.querySelector("[data-contact-form]");
  if (!form) return;
  var button = form.querySelector('[type="submit"]');
  var status = form.querySelector("[data-contact-status]");
  var key = form.elements.access_key.value;
  var sending = false;

  function showStatus(state, message) {
    form.dataset.state = state;
    status.textContent = message;
    status.hidden = !message;
  }

  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(key)) {
    showStatus("unavailable", "현재 문의 접수를 준비하고 있습니다. 잠시 후 다시 이용해 주세요.");
    return;
  }
  button.disabled = false;
  form.dataset.state = "idle";
  ["name", "email", "subject", "message"].forEach(function (name) {
    form.elements[name].addEventListener("input", function () { this.setCustomValidity(""); });
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (sending) return;
    ["name", "email", "subject", "message"].forEach(function (name) {
      var input = form.elements[name];
      input.setCustomValidity(input.value.trim() ? "" : "공백만 입력할 수 없습니다.");
    });
    if (!form.reportValidity()) return;
    if (form.elements.botcheck.checked) {
      showStatus("error", "문의 내용을 다시 확인해 주세요.");
      return;
    }

    var payload = {
      access_key: key,
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      subject: form.elements.subject.value.trim(),
      message: form.elements.message.value.trim(),
      from_name: form.elements.from_name.value,
      consent: "개인정보 처리 안내 확인 및 문의 전달 동의"
    };
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 20000);
    sending = true;
    button.disabled = true;
    button.textContent = "전송 중…";
    form.setAttribute("aria-busy", "true");
    showStatus("sending", "문의 내용을 전달하고 있습니다. 잠시 기다려 주세요.");

    try {
      var response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
        referrerPolicy: "no-referrer"
      });
      var result = await response.json();
      if (!response.ok || result.success !== true) throw new Error("submission_not_confirmed");
      form.reset();
      showStatus("success", "문의가 접수되었습니다. 답변이 필요한 경우 입력하신 이메일로 연락드리겠습니다.");
    } catch (error) {
      showStatus("error", error.name === "AbortError"
        ? "응답을 확인하지 못했습니다. 접수되었을 수 있으므로 잠시 기다린 뒤 다시 확인해 주세요. 입력 내용은 유지됩니다."
        : "문의 접수를 확인하지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요. 입력 내용은 유지됩니다.");
    } finally {
      clearTimeout(timeout);
      sending = false;
      button.disabled = false;
      button.textContent = "문의 보내기";
      form.setAttribute("aria-busy", "false");
      status.focus();
    }
  });
})();
