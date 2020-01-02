#!/bin/bash
# Örebro University IPW robot web interface
# Copyright (C) $today.year  Arvid Norlander
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

# Messy script to do the majority of the work converting a ros type to a TS interface. Some post processing may be
# needed.
#
# Usage: ros_type_to_ts.sh [msg|srv] package/type

error() {
	echo -e "\e[0;31m$*\e[0m" >&2
	exit 1
}

if [[ $# -ne 2 ]]; then
	error "Usage: $0 [msg|srv] package/type"
fi

TYPE="$1"
NAME="$2"
PKG="$(grep -Eo '^.*/' <<< "$NAME" | sed 's#/$##')"
MSG="$(grep -Eo '/.*$' <<< "$NAME" | sed 's#^/##')"

CMD=ros$TYPE

# Capture output. We want to avoid a subshell and thus can't pipe it into read
output="$("$CMD" show -r "$NAME")" || error "Failed to read $NAME"

echo -e "\e[1mPackage: $PKG\e[0m\n"

case $TYPE in
	msg)
		echo "export class $MSG extends Message {"
		;;
	srv)
		echo "export class ${MSG}Request extends ServiceRequest {"
		;;
	*)
		error "Unknown input type."
		;;
esac

FIELDS=()
UNKNOWN_TYPES=()

# Output a constructor for the current class and then reset the fields.
constructor() {
	echo
	echo "    constructor(values: {"
	for f in "${FIELDS[@]}"; do
		echo "        $f"
	done
	echo "    }) {"
	echo "        super(values);"
	echo "    }"
	FIELDS=()
}

while read -r line; do
	if [[ -z "$line" ]]; then
		echo
		continue
	fi

	if [[ "$line" == "---" ]]; then
		case $TYPE in
			msg)
				error "Unexpected --- in message"
				;;
			srv)
				constructor
				echo "}"
				echo "export class ${MSG}Response extends ServiceResponse {"
				;;
			*)
				error "Unknown input type."
				;;
		esac
		continue
	fi

	# Copy over comments
	if grep -Eq '^#' <<< "$line"; then
		echo "    // $(sed 's/^\# *//' <<< "$line")"
		continue
	fi

	# Tokenise
	type="$(awk '{print $1}' <<< "$line")"
	name="$(awk '{print $2}' <<< "$line")"

	# Strip array info
	non_array_type=$(sed 's/\[[0-9]*\]//' <<< "$type")

	# Convert the type
	case "$non_array_type" in
		*/*) base_type=$(sed "s#/#.#" <<< $type) ;;
		Header) base_type=std_msgs.Header ;;
		time) base_type=Time ;;
		duration) base_type=Duration ;;
		string) base_type="string" ;;
		bool) base_type=boolean ;;
		float* | uint* | int*) base_type=number ;;
		*)
			UNKNOWN_TYPES+=("$non_array_type")
			base_type="$non_array_type"
			;;
	esac

	# Handle array types
	if grep -Eq '\[' <<< "$type"; then
		full_type="${base_type}[]"
	else
		full_type="$base_type"
	fi

	# Handle constants
	if grep -Eq '=' <<< "$line"; then
		value="$(awk '{print $4}' <<< "$line")"
		echo "    static readonly $name: $full_type = $value;"
		continue
	fi

	# If we got here, this is a normal field.
	echo "    $name: $full_type;"
	FIELDS+=("$name?: $full_type;")
done <<< "$output"

constructor

echo "}"

if [[ "${#UNKNOWN_TYPES[@]}" -gt 0 ]]; then
	echo -e "\n\e[1mUnknown type encountered while processing (may be local from same package):\e[0m"
	for t in "${UNKNOWN_TYPES[@]}"; do
		echo -e " - ${t}"
	done
fi
