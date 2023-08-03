const endpoint = 'http://localhost:8881';
const submission_info = {
  user_id: 'hcTng7A=',
  task_id: 'yxz4XJE=',
};

/** @return {string} */
function get_human_readable_size(/** @type {number} */ bytes) {
  let _bytes = bytes;
  let size = _bytes + ' bytes';
  const units = ['KiB', 'MiB', 'GiB', 'TiB'];
  for (let i = 0, approx = _bytes / 1024; approx > 1; approx /= 1024, i++) {
    size = approx.toFixed(3) + ' ' + units[i];
  }
  return size;
}

$(function (param) {
  let input_file = $('#input_file');
  let log_view = $('#log_view');
  /** @type {string | undefined} */
  let last_submitted_file_id = undefined;

  function append_log(/** @type {string} */ message) {
    log_view.val(log_view.val() + `${message}\n`);
  }

  function clear_log() {
    log_view.val('');
  }

  $('#upload_button').on('click', async function () {
    /** @type {File} */
    const file = input_file[0].files[0];
    if (!file) {
      return;
    }

    clear_log();
    // Fetch upload URL
    try {
      append_log(`-- Add new submission --`);
      let res = await fetch(`${endpoint}/add_submission?${new URLSearchParams(submission_info)}`, {
        method: 'POST',
      });
      if (!res.ok) {
        append_log(`-- Failed to add new submission (status=${res.status}) --`);
        return;
      }

      /** @type {{upload_url: string, file_id: string}} */
      const { upload_url, file_id } = await res.json();
      append_log(`-- Retrieve upload information {upload_url="${upload_url}", file_id="${file_id}"} --`);
      append_log(`-- Start uploading the file --`);

      // Upload raw file content with progress
      let status_code;
      await $.ajax({
        xhr: function () {
          const xhr = new window.XMLHttpRequest();
          xhr.upload.addEventListener(
            'progress',
            function (ev) {
              if (ev.lengthComputable) {
                const completed = (ev.loaded / ev.total) * 100;
                append_log(`-- Uploaded file ... ${completed}% --`);
              }
            },
            false
          );
          return xhr;
        },
        type: 'PUT',
        url: upload_url,
        processData: false,
        contentType: 'application/octet-stream',
        data: file,
      }).done(function (data, status, xhr) {
        status_code = xhr.status;
      });

      if (!status_code) {
        append_log(`-- Upload failed (status=${res.status}) --`);
        return;
      }

      append_log(`-- Upload successful --`);
      append_log(`-- Update submission status --`);

      res = await fetch(`${endpoint}/done_submission?${new URLSearchParams({ file_id })}`, {
        method: 'POST',
      });

      if (!res.ok) {
        append_log(`-- Failed to update the submission status (status=${res.status}) --`);
        return;
      }

      last_submitted_file_id = file_id;
      append_log(` -- Submitted ${file_id} --`);
      append_log(`-- Submission completed --`);
    } catch (error) {
      append_log(`-- Internal error -- \n${JSON.stringify(error)}`);
      console.error(error);
    }
  });

  input_file.on('change', function () {
    /** @type {File | undefined} */
    const file = input_file[0].files[0];
    if (!file) {
      return;
    }
    append_log(`-- Selected ${file.name} (${get_human_readable_size(file.size)}) --`);
  });

  $('#download_button').on('click', async function () {
    if (last_submitted_file_id) {
      try {
        const res = await fetch(
          `${endpoint}/get_download_url?${new URLSearchParams({ file_id: last_submitted_file_id })}`
        );
        if (!res.ok) {
          append_log(`-- Failed to fetch the download URL (status=${res.status}) --`);
          return;
        }
        /** @type {{url: string}}} */
        const { url } = await res.json();
        append_log(`-- The file can be accessed via ${url} --`);
        window.open(url, '_blank');
      } catch (error) {
        append_log(`-- Internal error -- \n${JSON.stringify(error)}`);
        console.error(error);
      }
    }
  });
});
