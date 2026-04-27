if [[ -n "${_POLYHIVE_ZSH_INTEGRATION_LOADED-}" ]]; then
  return
fi
typeset -g _POLYHIVE_ZSH_INTEGRATION_LOADED=1

autoload -Uz add-zsh-hook

typeset -g _POLYHIVE_ZSH_COMMAND_ACTIVE=0

function _polyhive_osc633() {
  printf '\e]633;%s\a' "$1"
}

function _polyhive_precmd() {
  local command_status=$?
  if [[ "$_POLYHIVE_ZSH_COMMAND_ACTIVE" == "1" ]]; then
    _polyhive_osc633 "D;${command_status}"
    _POLYHIVE_ZSH_COMMAND_ACTIVE=0
  fi
  printf '\e]2;%s\a' "${PWD/#$HOME/~}"
  _polyhive_osc633 "A"
}

function _polyhive_preexec() {
  _POLYHIVE_ZSH_COMMAND_ACTIVE=1
  _polyhive_osc633 "B"
  _polyhive_osc633 "C"
  printf '\e]2;%s\a' "$1"
}

add-zsh-hook precmd _polyhive_precmd
add-zsh-hook preexec _polyhive_preexec
