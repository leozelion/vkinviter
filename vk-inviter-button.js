var vkl = document.createElement('button'),
	stat = document.createElement('pre'),
	isOn = 0, hbody = 0, mode = 0, timeout = 0,
	selector = '',
	spamObj = {
		i: 0,
		invites: 0,
		count: 0,
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
		selector = ".friends_controls > .button_wide:not(.secondary):not(.button_disabled)";
		stat.innerHTML = "Выслано: 0\tНайдено: 0";
		spamObj.text = "Выслать приглашение";
	} else { // отменить
		selector = ".friends_controls > .button_wide.secondary:not(.button_disabled)";
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
		if (spamObj.parent && spamObj.parent.innerText.includes('Лимит приглашений исчерпан')) {
			console.log('Limit reached. Stop.');
			vkl.onclick();
			return;
		}
		if (spamObj.rows[spamObj.i] && spamObj.rows[spamObj.i].offsetParent) {
			let a = spamObj.rows[spamObj.i];
			spamObj.parent = a.offsetParent;
			// на всякий случай проверяем, та ли кнопка
			if (a.innerHTML === spamObj.text) {
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
			<div class="radiobtn on" onclick="changeMode(this, 0);" role="radio" aria-checked="true">Выслать приглашение</div>
			<div class="radiobtn" onclick="changeMode(this, 1);" role="radio" aria-checked="false">Отменить приглашение</div>
		</div>
		<div class="ui_search_fltr_sel" id="spam-timeout">
			<input class="step_slider" type="range" onchange="changeTimeout(this.value);" min="1" max="100">
		</div>
	</div>`;
changeMode(null, 0);
changeTimeout(50);

document.getElementById('spam-block').append(vkl, stat);

// предупреждение пользователя перед закрытием/перезагрузкой вкладки
window.addEventListener('beforeunload', function (evt) {
	evt = evt || window.event;
	evt.returnValue = false;
	console.log('Before unload window: stopped at ' + spamObj.invites);
}, false);