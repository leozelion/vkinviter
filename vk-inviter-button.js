// ==UserScript==
// @name         VK inviter
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Let's spam! 😆
// @author       LZ (leozelion)
// @match        https://vk.com/friends?act=invite&group_id=*
// @run-at       document-end
// @icon         https://www.google.com/s2/favicons?sz=64&domain=vk.com
// @source       https://github.com/leozelion/vkinviter
// @updateURL    https://github.com/leozelion/vkinviter/raw/main/vk-inviter-button.js
// @downloadURL  https://github.com/leozelion/vkinviter/raw/main/vk-inviter-button.js
// @supportURL   https://github.com/leozelion/vkinviter/issues
// @grant window.close
// @grant window.focus
// @grant window.onurlchange
// ==/UserScript==

var vkl = document.createElement('button'),
	stat = document.createElement('pre'),
	isOn = 0, hbody = 0, mode = 0, timeout = 0,
	selector = '',
	spamObj = {
		i: 0,
		invites: 0, // отправлено
		count: 0, // найдено
		rows: [],
		text: '',
		parent: null
	};
function changeMode(e, m) {
	e && Array.from(document.getElementById('spam-mode').children).forEach(function (radio) {
		if (radio == e) {
			radio.classList.add("on");
			radio.setAttribute("aria-checked", "true");
		} else {
			radio.classList.remove("on");
			radio.setAttribute("aria-checked", "false");
		}
	});
	mode = m; console.log('Mode changed to: ' + m);
	if (!mode) { // выслать
		selector = ".friends_controls > .FlatButton--primary:not(.FlatButton--disabled):not(.FlatButton--locked)";
		stat.innerHTML = "Выслано: 0\tНайдено: 0";
		spamObj.text = "Выслать приглашение";
	} else { // отменить
		selector = ".friends_controls > .FlatButton--secondary:not(.FlatButton--disabled)";
		stat.innerHTML = "Отменено: 0\tНайдено: 0";
		spamObj.text = "Отменить приглашение";
	}
	spamObj.i = 0;
	spamObj.count = 0;
	spamObj.invites = 0;
}
function changeTimeout(t) {
	timeout = t;
	console.log('Timeout changed to: ' + t);
}

spamObj.click = function () {
	if (!isOn) {
		return;
	}
	let t = timeout;
	console.log('start click(), length: ' + spamObj.rows.length +
		', i: ' + spamObj.i);
	// если появляется капча, то кнопку не нажимаем, но функция рекурсивно продолжает вызываться
	if (document.getElementsByClassName("captcha").length === 0) {
		// если лимит исчерпан, в контейнере прошлой кнопки появляется сообщение
		if (spamObj.parent && spamObj.parent.innerText.includes('Лимит приглашений исчерпан')) {
			console.log('Limit reached. Stop.');
			vkl.onclick();
			return;
		}
		// проверяем offsetParent на случай, если кнопка нашлась скриптом, но по факту её уже нет
		if (spamObj.rows[spamObj.i] && spamObj.rows[spamObj.i].offsetParent) {
			let a = spamObj.rows[spamObj.i];
			spamObj.parent = a.offsetParent;
			// если скрипт уже нажимал кнопку, значит под кнопкой уже должно быть слово "отправлено"
			if (spamObj.parent && spamObj.parent.innerText.includes('Отправлено')) {
				console.log('Уже отправлено. Пропускаем.');
				// меняем кнопку на текст, чтобы на ней не зацикливаться
				spamObj.parent.lastChild.innerHTML = "Ошибка";
				spamObj.invites--;
			}
			// на всякий случай проверяем, та ли кнопка
			else if (a.innerText === spamObj.text) {
				a.scrollIntoView({ block: "center", behavior: "smooth" });
				spamObj.invites++;
				stat.innerHTML = (!mode ? "Выслано: " : "Отменено: ") + spamObj.invites + "\tНайдено: " + spamObj.count;
				console.log('Invite sended to ' + spamObj.parent.innerText);
				a.after((!mode ? "Отправлено (" : "Отменено (") + spamObj.invites + ')');
				a.onclick();
			}
		} else {
			console.log('Undefined parent: ' + spamObj.rows[spamObj.i]);
		}
		spamObj.i++;
	} else {
		console.log('Waiting for resolve Captcha, slow down recursion');
		t += 100;
	}
	// если нажали на последнюю кнопку, то скроллим и не вызываем клик еще раз
	if (spamObj.rows.length > 0 && spamObj.i >= spamObj.rows.length) {
		console.log('Last button, i:' + spamObj.i + ' >= length:' + spamObj.rows.length);
		window.setTimeout(spamObj.scroll, Math.random() * 300 + 150);
		return;
	}
	// если есть следующая кнопка, или мы зациклились на капче, вызываем функцию еще раз
	if (spamObj.rows[spamObj.i]) {
		window.setTimeout(spamObj.click, Math.random() * 300 + t*10);
	}
};
spamObj.scroll = function () {
	//hbody = document.body.scrollHeight;
	if (!isOn) {
		return;
	}
	let t = timeout;
	console.log('start scroll(), hbody: ' + hbody + 
		', scrollHeigh: ' + document.body.scrollHeight + 
		', length: ' + spamObj.rows.length);

	spamObj.rows = document.querySelectorAll(selector);
	// если нет кнопок, скроллим страницу
	if (spamObj.rows.length === 0) {
		hbody = document.body.scrollHeight;
		window.scrollTo({top: hbody, behavior: 'smooth'});
		// в этот момент body.scrollHeight еще не поменялся, потому что js работает в 1 поток и обновление переменных будет выполнено при следующем вызове функции
		console.log('scroll to ' + document.body.scrollHeight);
		// и рекурсивно запускаем еще раз
		window.setTimeout(spamObj.scroll, Math.random() * 300 + 150);
	} else {
		spamObj.count += spamObj.rows.length;
		spamObj.i = 0;
		console.log('Buttons found! New count: ' + spamObj.count);
		window.setTimeout(spamObj.click, Math.random() * 300 + t*10);
	}
};

vkl.className = 'flat_button button_wide';
vkl.innerHTML = "Start!";
vkl.onclick = function () {
	if (isOn == 0) {
		isOn = 1;
		vkl.innerHTML = "Stop!";
		spamObj.scroll();
		//spamObj.click();
	} else {
		vkl.innerHTML = "Start!";
		isOn = 0;
	}
};
document.getElementById('narrow_column').innerHTML += `
	<div id="spam-block" class="page_block" style="padding: 14px 16px">
		<div class="ui_search_fltr_sel" id="spam-mode">
			<div class="radiobtn on" role="radio" aria-checked="true">Выслать приглашение</div>
			<div class="radiobtn" role="radio" aria-checked="false">Отменить приглашение</div>
		</div>
		<div class="ui_search_fltr_sel">
			<input id="spam-timeout" class="step_slider" type="range" style="direction: rtl" min="1" max="100">
		</div>
	</div>`;
changeMode(null, 0);
changeTimeout(50);

document.getElementById('spam-block').append(vkl, stat);
document.getElementById('spam-timeout').addEventListener('change', function (e) {
	changeTimeout(Number(e.target.value));
});
let radios = document.getElementById('spam-mode').children;
for (let i = 0; i < radios.length; i++) {
	radios[i].addEventListener('click', function (e) { changeMode(e.target, i) });
}

// предупреждение пользователя перед закрытием/перезагрузкой вкладки
window.addEventListener('beforeunload', function (evt) {
	evt = evt || window.event;
	evt.returnValue = false;
	console.log('Before unload window: stopped at ' + spamObj.invites);
}, false);