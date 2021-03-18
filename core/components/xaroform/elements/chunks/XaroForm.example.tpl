<form method="post" class="x-form" enctype="multipart/form-data">
    {csrf_field()}
    <input type="hidden" name="xaro_action" value="q">
    <div class="x-form__field">
        <label for="name">Имя:</label>
        <input type="text" name="name" id="name" class="x-form__input x-form__input--text" value="{$modx->getPlaceholder('xf.name')}">
    </div>
    <div class="x-form__field">
        <label for="email">Email:</label>
        <input type="text" name="email" id="email" class="x-form__input x-form__input--text" value="{$modx->getPlaceholder('xf.email')}">
    </div>
    <div class="x-form__field">
        <label for="password">Пароль:</label>
        <input type="text" name="password" id="password" class="x-form__input x-form__input--text" value="{$modx->getPlaceholder('xf.password')}">
    </div>
    <div class="x-form__field">
        <label for="password_confirm">Подтвердите пароль:</label>
        <input type="text" name="password_confirm" id="password_confirm" class="x-form__input x-form__input--text" value="{$modx->getPlaceholder('xf.password_confirm')}">
    </div>
    <div class="x-form__field">
        <input type="checkbox" name="policy" id="policy" class="x-form__input x-form__input--checkbox">
        <label for="policy">Согласен с политикой конфиденциальности</label>
    </div>
    <div class="x-form__field">
        <input type="checkbox" name="checkbox[]" id="checkbox-1" value="checkbox-1" class="x-form__input x-form__input--checkbox">
        <label for="checkbox-1">Checkbox 1</label><br>
        <input type="checkbox" name="checkbox[]" id="checkbox-2" value="checkbox-2" class="x-form__input x-form__input--checkbox">
        <label for="checkbox-2">Checkbox 2</label>
    </div>
    <div class="x-form__field">
        <input type="radio" name="radio" id="radio-1" value="radio-1" class="x-form__input x-form__input--radio">
        <label for="radio-1">Radio 1</label><br>
        <input type="radio" name="radio" id="radio-2" value="radio-2" class="x-form__input x-form__input--radio">
        <label for="radio-2">Radio 2</label>
    </div>
    <div class="x-form__field">
        <select name="select[]" id="select" class="x-form__input x-form__input--select" multiple>
            <option value="" disabled selected>select option</option>
            <option value="select-1">option 1</option>
            <option value="select-2">option 2</option>
        </select>
    </div>
    <div class="x-form__field">
        <label for="msg">Сообщение:</label><br>
        <textarea name="msg" id="msg" cols="30" rows="10" class="x-form__input x-form__input--text"></textarea>
    </div>
    <div class="x-form__field">
        <label for="file">Файл:</label>
        <input type="file" name="file" id="file" class="x-form__input x-form__input--file">
    </div>
    <div class="x-form__btns">
        <input type="submit" class="x-form__btn x-form__btn-submit" value="Отправить" />
    </div>

    <!-- <div class="test">
        <input type="checkbox" name="checkbox-test" id="checkbox-test-0" value="0">
        <label for="checkbox-test-0">checkbox-test-0</label><br>
        <input type="checkbox" name="checkbox-test" id="checkbox-test-1" value="1">
        <label for="checkbox-test-1">checkbox-test-1</label>
        <hr>
        <input type="radio" name="radio-test" id="radio-test-0" value="0">
        <label for="radio-test-0">radio-test-0</label><br>
        <input type="radio" name="radio-test" id="radio-test-1" value="1">
        <label for="radio-test-1">radio-test-1</label>
        <hr>
        <label for="select-test"></label>
        <select name="select-test" id="select-test">
            <option value="">-- select --</option>
            <option value="0">option 0</option>
            <option value="1">option 1</option>
        </select>
        <hr>
        <textarea name="textarea-test" id="textarea-test" cols="30" rows="10"></textarea>
        <hr>
    </div> -->
</form>