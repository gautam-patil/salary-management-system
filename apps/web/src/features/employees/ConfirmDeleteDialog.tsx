import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Employee } from "@acme/shared";
import { deleteEmployee } from "../../api/employees";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/modal";

interface Props {
  employee: Employee;
  onClose: () => void;
  onDeleted: () => void;
}

export function ConfirmDeleteDialog({ employee, onClose, onDeleted }: Props) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>();

  const mutation = useMutation({
    mutationFn: () => deleteEmployee(employee.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee-filters"] });
      onDeleted();
    },
    onError: () => setError("Could not delete the employee. Please try again."),
  });

  return (
    <Modal title="Delete employee" onClose={onClose}>
      <p className="text-sm">{`Delete ${employee.fullName}? This cannot be undone.`}</p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" autoFocus onClick={onClose}>
          Cancel
        </Button>
        <Button variant="destructive" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}
