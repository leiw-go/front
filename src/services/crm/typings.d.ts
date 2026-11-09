declare namespace Crm {
  type changeStageParams = {
    id: string;
  };

  type confirmParams = {
    id: string;
  };

  type convertCurrencyParams = {
    amount: number;
    from: string;
    to: string;
    date?: string;
  };

  type createContactParams = {
    customerId: string;
  };

  type createQuotationFromInquiryParams = {
    id: string;
  };

  type CrmCurrencyConvertDto = {
    amount?: number;
    fromCurrency?: string;
    toCurrency?: string;
    date?: string;
    rate?: number;
    convertedAmount?: number;
    rateMissing?: boolean;
  };

  type CrmCurrencyDto = {
    id?: string;
    currencyCode?: string;
    currencyName?: string;
    symbol?: string;
    numericCode?: string;
    isCommon?: number;
    currencyLevel?: string;
    status?: string;
    suspectDays?: number;
    recoverDays?: number;
  };

  type CrmCurrencyRateCheckDto = {
    id?: string;
    syncId?: string;
    baseCurrency?: string;
    quoteCurrency?: string;
    primaryRate?: number;
    primaryDate?: string;
    secondaryRate?: number;
    secondaryDate?: string;
    deviationRate?: number;
    dateGapDays?: number;
    threshold?: number;
    checkResult?: string;
    rejectReason?: string;
    checkedAt?: string;
  };

  type CrmCurrencyRateDto = {
    id?: string;
    baseCurrency?: string;
    quoteCurrency?: string;
    rate?: number;
    rateDate?: string;
    source?: string;
    crossSource?: string;
    crossStatus?: string;
    deviationRate?: number;
    dateGapDays?: number;
  };

  type CrmCurrencyRateRequest = {
    quoteCurrency?: string;
    rate?: number;
    rateDate?: string;
  };

  type CrmCurrencySyncStatusDto = {
    syncId?: string;
    triggerType?: string;
    syncStatus?: string;
    primaryStatus?: string;
    primaryRows?: number;
    primaryDate?: string;
    secondaryStatus?: string;
    secondaryRows?: number;
    secondaryDate?: string;
    comparedCount?: number;
    matchedCount?: number;
    warnedCount?: number;
    rejectedCount?: number;
    singleCount?: number;
    savedCount?: number;
    skippedCount?: number;
    maxDeviation?: number;
    maxDeviationCurrency?: string;
    errorMsg?: string;
    durationMs?: number;
    startedAt?: string;
    finishedAt?: string;
    stale?: boolean;
  };

  type CrmDashboardCustomerSourceDto = {
    source?: string;
    customerCount?: number;
    opportunityCount?: number;
    opportunityAmountBase?: number;
  };

  type CrmDashboardReceivableAgingDto = {
    totalCount?: number;
    totalAmountBase?: number;
    buckets?: CrmReceivableAgingBucketDto[];
  };

  type CrmDashboardSummaryDto = {
    monthDealAmount?: number;
    overdueReceivableAmount?: number;
    activeCustomerCount?: number;
    openOpportunityCount?: number;
    openOpportunityAmountBase?: number;
  };

  type CrmDashboardTopProductDto = {
    productId?: string;
    productName?: string;
    productCode?: string;
    dealAmountBase?: number;
    dealQuantity?: number;
    orderCount?: number;
  };

  type CrmDashboardTrendDto = {
    period?: string;
    newCustomerCount?: number;
    newOpportunityCount?: number;
    newOpportunityAmountBase?: number;
    dealAmountBase?: number;
    winRate?: number;
  };

  type CrmEmailCampaignDto = {
    id?: string;
    name?: string;
    templateId?: string;
    targetType?: string;
    targetValue?: string;
    campaignStatus?: string;
    totalCount?: number;
    successCount?: number;
    failCount?: number;
    sentAt?: string;
    ownerId?: string;
  };

  type CrmEmailCampaignRequest = {
    name?: string;
    templateId?: string;
    targetType?: string;
    targetValue?: string;
  };

  type CrmEmailLogDto = {
    id?: string;
    campaignId?: string;
    contactId?: string;
    email?: string;
    sendStatus?: string;
    errorMsg?: string;
    sentAt?: string;
  };

  type CrmEmailPreviewDto = {
    subject?: string;
    content?: string;
    templateId?: string;
    unresolvedPlaceholders?: string[];
  };

  type CrmEmailTemplateDto = {
    id?: string;
    name?: string;
    subject?: string;
    content?: string;
    language?: string;
    templateType?: string;
  };

  type CrmEmailTemplateRequest = {
    id?: string;
    name?: string;
    subject?: string;
    content?: string;
    language?: string;
    templateType?: string;
  };

  type CrmInquiryDto = {
    id?: string;
    customerId?: string;
    contactId?: string;
    inquiryNo?: string;
    source?: string;
    subject?: string;
    targetPrice?: number;
    currencyCode?: string;
    quantity?: number;
    unit?: string;
    expectDeliveryDate?: string;
    inquiryStatus?: string;
    content?: string;
    ownerId?: string;
    firstReplyAt?: string;
    quotations?: CrmQuotationSummaryDto[];
    pendingQuote?: boolean;
  };

  type CrmInquiryQueryRequest = {
    page?: number;
    size?: number;
    inquiryStatus?: string;
    customerId?: string;
    ownerId?: string;
    source?: string;
    pendingQuote?: boolean;
  };

  type CrmInquiryRequest = {
    customerId?: string;
    contactId?: string;
    source?: string;
    subject?: string;
    targetPrice?: number;
    currencyCode?: string;
    quantity?: number;
    unit?: string;
    expectDeliveryDate?: string;
    inquiryStatus?: string;
    content?: string;
    ownerId?: string;
  };

  type CrmOpportunityDto = {
    id?: string;
    customerId?: string;
    name?: string;
    stage?: string;
    amount?: number;
    currencyCode?: string;
    amountBase?: number;
    winRate?: number;
    expectCloseDate?: string;
    competitor?: string;
    lostReason?: string;
    ownerId?: string;
    remark?: string;
  };

  type CrmOpportunityPipelineDto = {
    stages?: StageBucket[];
    winRate?: number;
    totalCount?: number;
    totalAmountBase?: number;
  };

  type CrmOpportunityQueryRequest = {
    page?: number;
    size?: number;
    stage?: string;
    ownerId?: string;
    customerId?: string;
    minAmount?: number;
    maxAmount?: number;
    name?: string;
  };

  type CrmOpportunityRequest = {
    customerId?: string;
    name?: string;
    stage?: string;
    amount?: number;
    currencyCode?: string;
    winRate?: number;
    expectCloseDate?: string;
    competitor?: string;
    lostReason?: string;
    ownerId?: string;
    remark?: string;
  };

  type CrmOpportunityStageRequest = {
    stage?: string;
    lostReason?: string;
  };

  type CrmOrderDto = {
    id?: string;
    orderNo?: string;
    customerId?: string;
    quotationId?: string;
    opportunityId?: string;
    currencyCode?: string;
    totalAmount?: number;
    totalAmountBase?: number;
    incoterm?: string;
    paymentTerm?: string;
    depositRate?: number;
    orderStatus?: string;
    shipDate?: string;
    expectArriveDate?: string;
    ownerId?: string;
    remark?: string;
    items?: CrmOrderItemDto[];
    shipments?: CrmShipmentDto[];
    receivables?: CrmReceivableDto[];
  };

  type CrmOrderItemDto = {
    id?: string;
    productId?: string;
    productName?: string;
    specification?: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    amount?: number;
  };

  type CrmOrderItemRequest = {
    productId?: string;
    productName?: string;
    specification?: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    amount?: number;
  };

  type CrmOrderQueryRequest = {
    page?: number;
    size?: number;
    orderStatus?: string;
    customerId?: string;
    ownerId?: string;
    shipDateFrom?: string;
    shipDateTo?: string;
  };

  type CrmOrderReceiveRequest = {
    receivableId?: string;
    amount?: number;
    paidDate?: string;
    paymentMethod?: string;
    remark?: string;
  };

  type CrmOrderRequest = {
    customerId?: string;
    quotationId?: string;
    opportunityId?: string;
    currencyCode?: string;
    incoterm?: string;
    paymentTerm?: string;
    depositRate?: number;
    shipDate?: string;
    expectArriveDate?: string;
    ownerId?: string;
    remark?: string;
    items?: CrmOrderItemRequest[];
  };

  type CrmProductDto = {
    id?: string;
    productCode?: string;
    productName?: string;
    category?: string;
    specification?: string;
    unit?: string;
    weightKg?: number;
    volumeCbm?: number;
    costPrice?: number;
    costCurrency?: string;
    defaultPrice?: number;
    defaultCurrency?: string;
    moq?: number;
    hsCode?: string;
    origin?: string;
    productStatus?: number;
    remark?: string;
    prices?: CrmProductPriceDto[];
  };

  type CrmProductPriceDto = {
    id?: string;
    productId?: string;
    currencyCode?: string;
    price?: number;
    minQuantity?: number;
    validFrom?: string;
    validTo?: string;
  };

  type CrmProductPriceRequest = {
    currencyCode?: string;
    price?: number;
    minQuantity?: number;
    validFrom?: string;
    validTo?: string;
  };

  type CrmProductQueryRequest = {
    page?: number;
    size?: number;
    category?: string;
    productStatus?: number;
    keyword?: string;
  };

  type CrmProductRequest = {
    productCode?: string;
    productName?: string;
    category?: string;
    specification?: string;
    unit?: string;
    weightKg?: number;
    volumeCbm?: number;
    costPrice?: number;
    costCurrency?: string;
    defaultPrice?: number;
    defaultCurrency?: string;
    moq?: number;
    hsCode?: string;
    origin?: string;
    productStatus?: number;
    remark?: string;
  };

  type CrmQuotationDto = {
    id?: string;
    quotationNo?: string;
    customerId?: string;
    inquiryId?: string;
    opportunityId?: string;
    versionNo?: number;
    currencyCode?: string;
    incoterm?: string;
    markupRate?: number;
    discountRate?: number;
    totalAmount?: number;
    totalCost?: number;
    profitAmount?: number;
    profitRate?: number;
    totalAmountBase?: number;
    validUntil?: string;
    quotationStatus?: string;
    rejectReason?: string;
    ownerId?: string;
    remark?: string;
    items?: CrmQuotationItemDto[];
  };

  type CrmQuotationItemDto = {
    id?: string;
    productId?: string;
    productName?: string;
    specification?: string;
    quantity?: number;
    unit?: string;
    costPrice?: number;
    markupRate?: number;
    discountRate?: number;
    unitPrice?: number;
    amount?: number;
    manualPrice?: boolean;
  };

  type CrmQuotationItemRequest = {
    productId?: string;
    quantity?: number;
    markupRate?: number;
    discountRate?: number;
    unitPrice?: number;
    manualPrice?: boolean;
  };

  type CrmQuotationQueryRequest = {
    page?: number;
    size?: number;
    customerId?: string;
    quotationStatus?: string;
    currencyCode?: string;
    ownerId?: string;
    inquiryId?: string;
    expired?: boolean;
  };

  type CrmQuotationRejectRequest = {
    rejectReason?: string;
  };

  type CrmQuotationRequest = {
    customerId?: string;
    inquiryId?: string;
    opportunityId?: string;
    currencyCode?: string;
    incoterm?: string;
    markupRate?: number;
    discountRate?: number;
    validUntil?: string;
    ownerId?: string;
    remark?: string;
    items?: CrmQuotationItemRequest[];
  };

  type CrmQuotationSummaryDto = {
    id?: string;
    quotationNo?: string;
    versionNo?: number;
    currencyCode?: string;
    totalAmount?: number;
    quotationStatus?: string;
    validUntil?: string;
  };

  type CrmReceivableAgingBucket = {
    bucket?: string;
    label?: string;
    amount?: number;
    count?: number;
  };

  type CrmReceivableAgingBucketDto = {
    bucket?: string;
    label?: string;
    count?: number;
    amountBase?: number;
  };

  type CrmReceivableAgingDto = {
    buckets?: CrmReceivableAgingBucket[];
    totalOutstandingAmount?: number;
    totalOutstandingCount?: number;
  };

  type CrmReceivableDto = {
    id?: string;
    orderId?: string;
    currencyCode?: string;
    receivableType?: string;
    receivableAmount?: number;
    receivedAmount?: number;
    outstandingAmount?: number;
    dueDate?: string;
    receivableStatus?: string;
    overdueDays?: number;
    ownerId?: string;
  };

  type CrmReceivableQueryRequest = {
    page?: number;
    size?: number;
    orderId?: string;
    receivableStatus?: string;
    ownerId?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    overdueOnly?: boolean;
  };

  type CrmReceivableWriteOffRequest = {
    amount?: number;
    paidDate?: string;
    paymentMethod?: string;
    remark?: string;
  };

  type CrmShipmentDto = {
    id?: string;
    orderId?: string;
    shippingNo?: string;
    shippingType?: string;
    departurePort?: string;
    destinationPort?: string;
    shipDate?: string;
    expectArriveDate?: string;
    actualArriveDate?: string;
    totalCbm?: number;
    totalWeight?: number;
    shipmentStatus?: string;
    remark?: string;
  };

  type CrmShipmentQueryRequest = {
    page?: number;
    size?: number;
    orderId?: string;
    shippingStatus?: string;
    shipDateFrom?: string;
    shipDateTo?: string;
  };

  type CrmShipmentRequest = {
    orderId?: string;
    shippingNo?: string;
    shippingType?: string;
    departurePort?: string;
    destinationPort?: string;
    shipDate?: string;
    expectArriveDate?: string;
    actualArriveDate?: string;
    totalCbm?: number;
    totalWeight?: number;
    shipmentStatus?: string;
    remark?: string;
  };

  type CustomerContactDto = {
    id?: string;
    customerId?: string;
    name?: string;
    position?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    language?: string;
    timezone?: string;
    isPrimary?: number;
    remark?: string;
  };

  type CustomerContactRequest = {
    name?: string;
    position?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    language?: string;
    timezone?: string;
    isPrimary?: number;
    remark?: string;
  };

  type CustomerDto = {
    id?: string;
    companyName?: string;
    shortName?: string;
    countryCode?: string;
    province?: string;
    city?: string;
    address?: string;
    website?: string;
    industry?: string;
    source?: string;
    level?: string;
    customerStatus?: string;
    ownerId?: string;
    remark?: string;
    contactCount?: number;
    opportunityCount?: number;
  };

  type CustomerQueryRequest = {
    companyName?: string;
    countryCode?: string;
    level?: string;
    source?: string;
    ownerId?: string;
    page?: number;
    size?: number;
  };

  type CustomerRequest = {
    companyName?: string;
    shortName?: string;
    countryCode?: string;
    province?: string;
    city?: string;
    address?: string;
    website?: string;
    industry?: string;
    source?: string;
    level?: string;
    customerStatus?: string;
    ownerId?: string;
    remark?: string;
  };

  type dashboardTopProductsParams = {
    limit?: number;
  };

  type dashboardTrendParams = {
    granularity?: string;
    periods?: number;
  };

  type deleteContactParams = {
    contactId: string;
  };

  type deleteCrmProductParams = {
    id: string;
  };

  type deleteCustomerParams = {
    id: string;
  };

  type deleteEmailTemplateParams = {
    id: string;
  };

  type deleteMessageParams = {
    id: string;
  };

  type deleteOpportunityParams = {
    id: string;
  };

  type deleteOrderParams = {
    id: string;
  };

  type DictionaryOptions = {
    levels?: string[];
    sources?: string[];
  };

  type exportCustomersParams = {
    companyName?: string;
    countryCode?: string;
    level?: string;
    source?: string;
    ownerId?: string;
    page?: number;
    size?: number;
  };

  type getContactParams = {
    contactId: string;
  };

  type getCrmProductParams = {
    id: string;
  };

  type getCustomerParams = {
    id: string;
  };

  type getInquiryParams = {
    id: string;
  };

  type getMessageParams = {
    id: string;
  };

  type getOpportunityParams = {
    id: string;
  };

  type getOrderParams = {
    id: string;
  };

  type getQuotationParams = {
    id: string;
  };

  type listCrmProductPricesParams = {
    id: string;
  };

  type listCrmProductsParams = {
    page?: number;
    size?: number;
    category?: string;
    productStatus?: number;
    keyword?: string;
  };

  type listCurrencyRatesParams = {
    baseCurrency?: string;
    quoteCurrency?: string;
    date?: string;
    source?: string;
  };

  type listCustomerContactsParams = {
    customerId: string;
  };

  type listCustomersParams = {
    companyName?: string;
    countryCode?: string;
    level?: string;
    source?: string;
    ownerId?: string;
    page?: number;
    size?: number;
  };

  type listEmailCampaignLogsParams = {
    id: string;
  };

  type listEmailCampaignsParams = {
    status?: string;
  };

  type listInquiriesParams = {
    page?: number;
    size?: number;
    inquiryStatus?: string;
    customerId?: string;
    ownerId?: string;
    source?: string;
    pendingQuote?: boolean;
  };

  type listMessagesParams = {
    page?: number;
    size?: number;
    read?: boolean;
    messageType?: string;
    level?: string;
  };

  type listOpportunitiesParams = {
    page?: number;
    size?: number;
    stage?: string;
    ownerId?: string;
    customerId?: string;
    minAmount?: number;
    maxAmount?: number;
    name?: string;
  };

  type listOrdersParams = {
    page?: number;
    size?: number;
    orderStatus?: string;
    customerId?: string;
    ownerId?: string;
    shipDateFrom?: string;
    shipDateTo?: string;
  };

  type listQuotationsParams = {
    page?: number;
    size?: number;
    customerId?: string;
    quotationStatus?: string;
    currencyCode?: string;
    ownerId?: string;
    inquiryId?: string;
    expired?: boolean;
  };

  type listReceivablesParams = {
    page?: number;
    size?: number;
    orderId?: string;
    receivableStatus?: string;
    ownerId?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    overdueOnly?: boolean;
  };

  type listShipmentsParams = {
    page?: number;
    size?: number;
    orderId?: string;
    shippingStatus?: string;
    shipDateFrom?: string;
    shipDateTo?: string;
  };

  type markMessageReadParams = {
    id: string;
  };

  type MessageDto = {
    id?: string;
    messageType?: string;
    level?: string;
    title?: string;
    content?: string;
    senderType?: string;
    senderId?: string;
    receiverId?: string;
    bizType?: string;
    bizId?: string;
    bizTitle?: string;
    read?: boolean;
    readAt?: string;
    createTime?: string;
  };

  type MessageQueryRequest = {
    page?: number;
    size?: number;
    read?: boolean;
    messageType?: string;
    level?: string;
  };

  type MessageSendRequest = {
    receiverId?: string;
    title?: string;
    content?: string;
  };

  type PageResponseCrmInquiryDto = {
    data?: CrmInquiryDto[];
    total?: number;
    page?: number;
    size?: number;
  };

  type PageResponseCrmOpportunityDto = {
    data?: CrmOpportunityDto[];
    total?: number;
    page?: number;
    size?: number;
  };

  type PageResponseCrmOrderDto = {
    data?: CrmOrderDto[];
    total?: number;
    page?: number;
    size?: number;
  };

  type PageResponseCrmProductDto = {
    data?: CrmProductDto[];
    total?: number;
    page?: number;
    size?: number;
  };

  type PageResponseCrmQuotationDto = {
    data?: CrmQuotationDto[];
    total?: number;
    page?: number;
    size?: number;
  };

  type PageResponseCrmReceivableDto = {
    data?: CrmReceivableDto[];
    total?: number;
    page?: number;
    size?: number;
  };

  type PageResponseCrmShipmentDto = {
    data?: CrmShipmentDto[];
    total?: number;
    page?: number;
    size?: number;
  };

  type PageResponseCustomerDto = {
    data?: CustomerDto[];
    total?: number;
    page?: number;
    size?: number;
  };

  type PageResponseMessageDto = {
    data?: MessageDto[];
    total?: number;
    page?: number;
    size?: number;
  };

  type previewEmailTemplateParams = {
    id: string;
  };

  type recalculateParams = {
    id: string;
  };

  type receiveOrderParams = {
    id: string;
  };

  type rejectParams = {
    id: string;
  };

  type replaceCrmProductPricesParams = {
    id: string;
  };

  type ResponseResultCrmCurrencyConvertDto = {
    code?: number;
    message?: string;
    data?: CrmCurrencyConvertDto;
    errors?: string[];
  };

  type ResponseResultCrmCurrencyRateDto = {
    code?: number;
    message?: string;
    data?: CrmCurrencyRateDto;
    errors?: string[];
  };

  type ResponseResultCrmCurrencySyncStatusDto = {
    code?: number;
    message?: string;
    data?: CrmCurrencySyncStatusDto;
    errors?: string[];
  };

  type ResponseResultCrmDashboardReceivableAgingDto = {
    code?: number;
    message?: string;
    data?: CrmDashboardReceivableAgingDto;
    errors?: string[];
  };

  type ResponseResultCrmDashboardSummaryDto = {
    code?: number;
    message?: string;
    data?: CrmDashboardSummaryDto;
    errors?: string[];
  };

  type ResponseResultCrmEmailCampaignDto = {
    code?: number;
    message?: string;
    data?: CrmEmailCampaignDto;
    errors?: string[];
  };

  type ResponseResultCrmEmailPreviewDto = {
    code?: number;
    message?: string;
    data?: CrmEmailPreviewDto;
    errors?: string[];
  };

  type ResponseResultCrmEmailTemplateDto = {
    code?: number;
    message?: string;
    data?: CrmEmailTemplateDto;
    errors?: string[];
  };

  type ResponseResultCrmInquiryDto = {
    code?: number;
    message?: string;
    data?: CrmInquiryDto;
    errors?: string[];
  };

  type ResponseResultCrmOpportunityDto = {
    code?: number;
    message?: string;
    data?: CrmOpportunityDto;
    errors?: string[];
  };

  type ResponseResultCrmOpportunityPipelineDto = {
    code?: number;
    message?: string;
    data?: CrmOpportunityPipelineDto;
    errors?: string[];
  };

  type ResponseResultCrmOrderDto = {
    code?: number;
    message?: string;
    data?: CrmOrderDto;
    errors?: string[];
  };

  type ResponseResultCrmProductDto = {
    code?: number;
    message?: string;
    data?: CrmProductDto;
    errors?: string[];
  };

  type ResponseResultCrmQuotationDto = {
    code?: number;
    message?: string;
    data?: CrmQuotationDto;
    errors?: string[];
  };

  type ResponseResultCrmReceivableAgingDto = {
    code?: number;
    message?: string;
    data?: CrmReceivableAgingDto;
    errors?: string[];
  };

  type ResponseResultCrmReceivableDto = {
    code?: number;
    message?: string;
    data?: CrmReceivableDto;
    errors?: string[];
  };

  type ResponseResultCrmShipmentDto = {
    code?: number;
    message?: string;
    data?: CrmShipmentDto;
    errors?: string[];
  };

  type ResponseResultCustomerContactDto = {
    code?: number;
    message?: string;
    data?: CustomerContactDto;
    errors?: string[];
  };

  type ResponseResultCustomerDto = {
    code?: number;
    message?: string;
    data?: CustomerDto;
    errors?: string[];
  };

  type ResponseResultDictionaryOptions = {
    code?: number;
    message?: string;
    data?: DictionaryOptions;
    errors?: string[];
  };

  type ResponseResultListCrmCurrencyDto = {
    code?: number;
    message?: string;
    data?: CrmCurrencyDto[];
    errors?: string[];
  };

  type ResponseResultListCrmCurrencyRateCheckDto = {
    code?: number;
    message?: string;
    data?: CrmCurrencyRateCheckDto[];
    errors?: string[];
  };

  type ResponseResultListCrmCurrencyRateDto = {
    code?: number;
    message?: string;
    data?: CrmCurrencyRateDto[];
    errors?: string[];
  };

  type ResponseResultListCrmDashboardCustomerSourceDto = {
    code?: number;
    message?: string;
    data?: CrmDashboardCustomerSourceDto[];
    errors?: string[];
  };

  type ResponseResultListCrmDashboardTopProductDto = {
    code?: number;
    message?: string;
    data?: CrmDashboardTopProductDto[];
    errors?: string[];
  };

  type ResponseResultListCrmDashboardTrendDto = {
    code?: number;
    message?: string;
    data?: CrmDashboardTrendDto[];
    errors?: string[];
  };

  type ResponseResultListCrmEmailCampaignDto = {
    code?: number;
    message?: string;
    data?: CrmEmailCampaignDto[];
    errors?: string[];
  };

  type ResponseResultListCrmEmailLogDto = {
    code?: number;
    message?: string;
    data?: CrmEmailLogDto[];
    errors?: string[];
  };

  type ResponseResultListCrmEmailTemplateDto = {
    code?: number;
    message?: string;
    data?: CrmEmailTemplateDto[];
    errors?: string[];
  };

  type ResponseResultListCrmProductPriceDto = {
    code?: number;
    message?: string;
    data?: CrmProductPriceDto[];
    errors?: string[];
  };

  type ResponseResultListCustomerContactDto = {
    code?: number;
    message?: string;
    data?: CustomerContactDto[];
    errors?: string[];
  };

  type ResponseResultMapStringInteger = {
    code?: number;
    message?: string;
    data?: Record<string, any>;
    errors?: string[];
  };

  type ResponseResultMapStringLong = {
    code?: number;
    message?: string;
    data?: Record<string, any>;
    errors?: string[];
  };

  type ResponseResultMessageDto = {
    code?: number;
    message?: string;
    data?: MessageDto;
    errors?: string[];
  };

  type ResponseResultPageResponseCrmInquiryDto = {
    code?: number;
    message?: string;
    data?: PageResponseCrmInquiryDto;
    errors?: string[];
  };

  type ResponseResultPageResponseCrmOpportunityDto = {
    code?: number;
    message?: string;
    data?: PageResponseCrmOpportunityDto;
    errors?: string[];
  };

  type ResponseResultPageResponseCrmOrderDto = {
    code?: number;
    message?: string;
    data?: PageResponseCrmOrderDto;
    errors?: string[];
  };

  type ResponseResultPageResponseCrmProductDto = {
    code?: number;
    message?: string;
    data?: PageResponseCrmProductDto;
    errors?: string[];
  };

  type ResponseResultPageResponseCrmQuotationDto = {
    code?: number;
    message?: string;
    data?: PageResponseCrmQuotationDto;
    errors?: string[];
  };

  type ResponseResultPageResponseCrmReceivableDto = {
    code?: number;
    message?: string;
    data?: PageResponseCrmReceivableDto;
    errors?: string[];
  };

  type ResponseResultPageResponseCrmShipmentDto = {
    code?: number;
    message?: string;
    data?: PageResponseCrmShipmentDto;
    errors?: string[];
  };

  type ResponseResultPageResponseCustomerDto = {
    code?: number;
    message?: string;
    data?: PageResponseCustomerDto;
    errors?: string[];
  };

  type ResponseResultPageResponseMessageDto = {
    code?: number;
    message?: string;
    data?: PageResponseMessageDto;
    errors?: string[];
  };

  type ResponseResultVoid = {
    code?: number;
    message?: string;
    data?: Record<string, any>;
    errors?: string[];
  };

  type sendEmailCampaignParams = {
    id: string;
  };

  type shipOrderParams = {
    id: string;
  };

  type StageBucket = {
    stage?: string;
    stageName?: string;
    count?: number;
    amountBase?: number;
    conversionRate?: number;
  };

  type submitParams = {
    id: string;
  };

  type transferCustomerParams = {
    id: string;
  };

  type TransferRequest = {
    newOwnerId?: string;
  };

  type updateContactParams = {
    contactId: string;
  };

  type updateCrmProductParams = {
    id: string;
  };

  type updateCustomerParams = {
    id: string;
  };

  type updateInquiryParams = {
    id: string;
  };

  type updateOpportunityParams = {
    id: string;
  };

  type updateOrderParams = {
    id: string;
  };

  type updateQuotationParams = {
    id: string;
  };

  type updateShipmentParams = {
    id: string;
  };

  type verifyCurrencyRatesParams = {
    quoteCurrency?: string;
    checkResult?: string;
  };

  type writeOffReceivableParams = {
    id: string;
  };
}
