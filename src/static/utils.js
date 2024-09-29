export function showAlert(message, type) {
    var toastContainer = $('#toasts');
    var toast = $(createToast(message, type));
    toastContainer.append(toast);
    var bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

function createToast(message, type) {
    return `
        <div id="liveToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${type ? "bg-" + type : ""} text-light">
                <div class="d-flex justify-content-between align-items-center w-100">
                    <div>
                        <i class="bi bi-bell-fill me-2"></i>
                        <strong>Notification</strong>
                    </div>
                    <button type="button" class="btn-close text-light" data-bs-dismiss="toast" aria-label="Close">
                    </button>
                </div>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
}

export function showConfirmModal() {
    return new Promise((resolve) => {
        $('#confirm-modal').modal('show');

        $("#confirm-button").on("click", () => {
            $('#confirm-modal').modal('hide');
            resolve(true);
        });

        $('#confirm-modal').on('hidden.bs.modal', function () {
            resolve(false);
        });
    });
}

export function showExportModal() {
    return new Promise((resolve) => {
        $('#export-modal').modal('show');

        $("#export-confirm-button").on("click", () => {
            if ($("#validation-course").val() == "")
                return;

            $('#export-modal').modal('hide');
            resolve(true);
        });

        $('#export-modal').on('hidden.bs.modal', function () {
            resolve(false);
        });
    });
}

