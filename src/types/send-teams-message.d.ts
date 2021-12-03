type NotifyOn = 'failure' | 'success' | 'fixed';

type SendResult = {
    workflowStatus: 'failure' | 'cancelled' | 'success',
    messageSent: boolean,
};
