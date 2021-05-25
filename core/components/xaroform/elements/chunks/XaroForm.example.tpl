<form method="post" class="x-form test-form" enctype="multipart/form-data" action="assets/components/xaroform/action.php">
    {*
        *}
        {csrf_field()}
    <!-- <input type="hidden" name="xaro_action" value="q"> -->
    <!-- <input type="hidden" name="g-recaptcha-response" id="g-recaptcha-response"> -->
    <div class="x-form__field">
        <label for="name">Имя:</label>
        <input type="text" name="name" id="name" class="x-form__input x-form__input--text" value="{'xf.name' | placeholder}">
    </div>
    <div class="x-form__field">
        <label for="email">Email:</label>
        <input type="text" name="email" id="email" class="x-form__input x-form__input--text" value="{'xf.email' | placeholder}">
    </div>
    <div class="x-form__field">
        <label for="password">Пароль:</label>
        <input type="text" name="password" id="password" class="x-form__input x-form__input--text" value="{'xf.password' | placeholder}">
    </div>
    <div class="x-form__field">
        <label for="password_confirm">Подтвердите пароль:</label>
        <input type="text" name="password_confirm" id="password_confirm" class="x-form__input x-form__input--text" value="{'xf.password_confirm' | placeholder}">
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
    <input type="text" name="test"><br>
    <input type="text" name="test2"><br>
    <div class="x-form__errors">
        
    </div>
</form>